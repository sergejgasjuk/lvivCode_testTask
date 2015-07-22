import express from "express";
import handlebars from "express-handlebars";
import bodyParser from "body-parser";
import multer from "multer";
import db from "./database";
import fs from "fs";

let app = express();
let photos = db.photos;
let users = db.users;
let imgUploadFinished = false;

// Configurations
app.engine('html', handlebars({
  defaultLayout: 'main',
  extname: '.html',
  layoutsDir: `${__dirname}/views/layouts`
}));

app.set('view engine', 'html');

app.set('views', `${__dirname}/views`);

app.use(express.static(`${__dirname}/public`));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(multer({
  dest: `${__dirname}/public/photos`,
  limits: {fileSize: 1024 * 1024, files: 1},
  rename(fieldname, filename) {
    return filename + Date.now();
  },
  onFileUploadStart(file) {
    if(!file && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
      return false;
    }

    console.log(`${file.originalname} is starting ...`);
  },
  onFileSizeLimit(file) {
    console.log('Failed: ', file.originalname);
    fs.unlink(`./${file.path}`);
  },
  onFileUploadComplete(file) {
    imgUploadFinished = true;
    console.log(`${file.fieldname} uploaded to ${file.path}`);
  }
}));

// Routes
app.post('/', (req, res) => {
  console.log(req.files)
  if (!req.files.userImage) {
    res.send("Please choose photo.");
  }

  if(imgUploadFinished) {
    let file = req.files.userImage;
    let photosOnDisk = fs.readdirSync(`${__dirname}/public/photos`);

    photosOnDisk.forEach((photo) =>
        photos.insert({
          name: photo,
          likes: 0,
          dislikes: 0
        })
    );

    photos.find({name: `${file.name}`}, (err, docs) => {
      res.render('home', {photo: docs[0]});
      //res.end();
    });
  } else {
    res.send(`Couln't load the image`);
  }
});

app.get('/', (req, res) => {
  photos.find({}, (err, allPhotos) => {
    users.find({ip: req.ip}, (err, user) => {
      let votedOn = [];
      let imageToShow = null;

      if(user.length === 1){
        votedOn = user[0].votes;
      }

      let notVotedOn = allPhotos.filter((photo) => { return votedOn.indexOf(photo._id) == -1; });

      if(notVotedOn.length > 0){
        imageToShow = notVotedOn[Math.floor(Math.random() * notVotedOn.length)];
      }

      res.render('home', {photo: imageToShow});
    });
  });
});

app.get('/standings', (req, res) => {
  photos.find({}, (err, allPhotos) => {
    allPhotos.sort((p1, p2) => {
      return (p2.likes - p2.dislikes) - (p1.likes - p1.dislikes);
    });

    res.render('standings', {standings: allPhotos});
  });
});

app.post('*', (req, res, next) => {
  users.insert({ip: req.ip, votes: []}, () => next());
});

app.post('/notcute', vote);
app.post('/cute', vote);
app.post('/comment', addComment);

function vote(req, res){
  let fieldToUpdate = {
    '/notcute': {dislikes: 1},
    '/cute': {likes: 1}
  };

  photos.find({name: req.body.photo }, (err, found) => {
    if(found.length === 1){
      photos.update(found[0], {$inc: fieldToUpdate[req.path]});
      users.update({ip: req.ip}, {$addToSet: { votes: found[0]._id}}, () => res.redirect('../'));
    }
    else {
      res.redirect('../');
    }
  });
}

function addComment(req, res) {
  photos.find({name: req.body.photo }, (err, found) => {
    console.log(req.body.comment);
    if(found.length === 1){
      photos.update(
        found[0],
        {$inc: {"comments.amount": 1}, $push: {"comments.list": req.body.comment}},
        () => {res.render('home', {photo: found[0]});});
    }
    else {
      res.redirect('../');
    }
  });
}

app.listen(8030);
console.log('Your application is running on http://localhost:8030');
