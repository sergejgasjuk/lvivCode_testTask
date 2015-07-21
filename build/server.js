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
    if (!file && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      return false;
    }

    console.log(file.originalname + " is starting ...");
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
app.post("/", function (req, res) {
  console.log(req.files);
  if (!req.files.userImage) {
    res.send("Please choose photo.");
  }

  if (imgUploadFinished) {
    var file = req.files.userImage;
    var photosOnDisk = _fs2["default"].readdirSync(__dirname + "/public/photos");

    photosOnDisk.forEach(function (photo) {
      return photos.insert({
        name: photo,
        likes: 0,
        dislikes: 0
      });
    });

    photos.find({ name: "" + file.name }, function (err, docs) {
      res.render("home", { photo: docs[0] });
      //res.end();
    });
  } else {
    res.send("Couln't load the image");
  }
});

app.get("/", function (req, res) {
  photos.find({}, function (err, allPhotos) {
    users.find({ ip: req.ip }, function (err, user) {
      var votedOn = [];
      var imageToShow = null;

      if (user.length === 1) {
        votedOn = user[0].votes;
      }

      var notVotedOn = allPhotos.filter(function (photo) {
        return votedOn.indexOf(photo._id) == -1;
      });

      if (notVotedOn.length > 0) {
        imageToShow = notVotedOn[Math.floor(Math.random() * notVotedOn.length)];
      }

      res.render("home", { photo: imageToShow });
    });
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
      photos.update(found[0], { $inc: fieldToUpdate[req.path] });
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