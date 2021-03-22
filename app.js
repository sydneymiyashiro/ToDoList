//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const lodash = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to DB
mongoose.connect("mongodb+srv://admin-sydney:Test123@cluster0.so7jt.mongodb.net/todolistDB", {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useFindAndModify: false
});


const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

// Insert Default Items
const item1 = new Item({name: "Welcome to your to do list!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// Routes
app.get("/", function(req, res) {
  
  Item.find({}, function(err, foundItems){

    // Insert default items only when DB is empty 
    if (foundItems.length === 0) {
      
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted default items");
        }
      });

      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  
  });

});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: itemName});

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    // Search for custom list, insert newItem
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    // Delete from custom list,
    // pull item with checkedItemId from custom list
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/:customListName", function(req,res){
  const customListName = lodash.capitalize(req.params.customListName);

  // Check to see if list already occurs
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName, 
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.get("/about", function(req, res){
  res.render("about");
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
