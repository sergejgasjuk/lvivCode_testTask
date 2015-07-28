"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _expressHandlebars = require("express-handlebars");

var _expressHandlebars2 = _interopRequireDefault(_expressHandlebars);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _multer = require("multer");

var _multer2 = _interopRequireDefault(_multer);

var _database = require("./database");

var _database2 = _interopRequireDefault(_database);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var app = (0, _express2["default"])();
var photos = _database2["default"].photos;
var users = _database2["default"].users;
var imgUploadFinished = false;

// Configurations
app.engine("html", (0, _expressHandlebars2["default"])({
  defaultLayout: "main",
  extname: ".html",
  layoutsDir: __dirname + "/views/layouts"
}));

app.set("view engine", "html");

app.set("views", __dirname + "/views");

app.use(_express2["default"]["static"](__dirname + "/public"));

app.use(_bodyParser2["default"].urlencoded({ extended: true }));

app.use((0, _multer2["default"])({
  dest: __dirname + "/public/photos",
  limits: { fileSize: 1024 * 1024, files: 1 },
  rename: function rename(fieldname, filename) {
    return filename + Date.now();
  },
  onFileUploadStart: function onFileUploadStart(file) {
    if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      console.log(file.originalname + " is starting ...");
    } else {
      console.log("Wrong mimeType!");
      return false;
    }
  },
  onFileSizeLimit: function onFileSizeLimit(file) {
    console.log("Failed: ", file.originalname);
    _fs2["default"].unlink("./" + file.path);
  },
  onFileUploadComplete: function onFileUploadComplete(file) {
    imgUploadFinished = true;
    console.log(file.fieldname + " uploaded to " + file.path);
  }
}));

// Routes
app.post("/imgUpload", function (req, res) {
  if (imgUploadFinished) {
    var file = req.files.userImage;
    var photosOnDisk = _fs2["default"].readdirSync(__dirname + "/public/photos");

    photosOnDisk.forEach(function (photo) {
      return photos.insert({
        name: photo,
        likes: 0,
        dislikes: 0,
        comments: {
          amount: 0,
          list: []
        }
      });
    });

    photos.find({ name: "" + file.name }, function (err, docs) {
      if (err || !docs) {
        res.status(520).send("Error!");
      } else {
        res.send(docs[0]);
      }
    });
  } else {
    res.send("Couldn't load the image");
  }
});

app.get("/", function (req, res) {
  photos.find({}, function (err, allPhotos) {
    users.find({ ip: req.ip }, function (err, user) {
      var votedOn = [];

      if (user.length === 1) {
        votedOn = user[0].votes;
      }

      var notVotedOn = allPhotos.filter(function (photo) {
        return votedOn.indexOf(photo._id) == -1;
      });

      //if(notVotedOn.length > 0){
      //  imageToShow = notVotedOn[Math.floor(Math.random() * notVotedOn.length)];
      //}

      res.render("home", { photos: notVotedOn });
    });
  });
});

app.post("/imgModal", function (req, res) {
  photos.find({ name: req.body.name }, function (err, found) {
    if (found) {
      res.render("imgModal", { layout: false, photo: found[0] });
    }
  });
});

app.post("/comment", function (req, res) {
  photos.find({ name: req.body.photo }, function (err, found) {
    if (found) {
      photos.update({ _id: found[0]._id }, { $inc: { "comments.amount": 1 }, $push: { "comments.list": req.body.comment } }, function () {
        return res.send(found[0]);
      });
    } else {
      res.status(520).send("Error!");
    }
  });
});

app.get("/standings", function (req, res) {
  photos.find({}, function (err, allPhotos) {
    allPhotos.sort(function (p1, p2) {
      return p2.likes - p2.dislikes - (p1.likes - p1.dislikes);
    });

    res.render("standings", { standings: allPhotos });
  });
});

app.post("*", function (req, res, next) {
  users.insert({ ip: req.ip, votes: [] }, function () {
    return next();
  });
});

app.post("/notcute", vote);
app.post("/cute", vote);

function vote(req, res) {
  var fieldToUpdate = {
    "/notcute": { dislikes: 1 },
    "/cute": { likes: 1 }
  };

  photos.find({ name: req.body.photo }, function (err, found) {
    if (found.length === 1) {
      photos.update({ _id: found[0]._id }, { $inc: fieldToUpdate[req.path] });
      users.update({ ip: req.ip }, { $addToSet: { votes: found[0]._id } }, function () {
        return res.redirect("../");
      });
    } else {
      res.redirect("../");
    }
  });
}

app.listen(8030);
console.log("Your application is running on http://localhost:8030");