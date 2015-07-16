"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _nedb = require("nedb");

var _nedb2 = _interopRequireDefault(_nedb);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var photos = new _nedb2["default"]({ filename: __dirname + "/data/photos", autoload: true });
var users = new _nedb2["default"]({ filename: __dirname + "/data/users", autoload: true });

photos.ensureIndex({ fieldName: "name", unique: true });
users.ensureIndex({ fieldName: "ip", unique: true });

var photosOnDisk = _fs2["default"].readdirSync(__dirname + "/public/photos");

photosOnDisk.forEach(function (photo) {
  return photos.insert({
    name: photo,
    likes: 0,
    dislikes: 0
  });
});

exports["default"] = { photos: photos, users: users };
module.exports = exports["default"];