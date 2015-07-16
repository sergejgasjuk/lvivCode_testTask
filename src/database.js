import Datastore from "nedb";
import fs from "fs";

let photos = new Datastore({ filename: `${__dirname}/data/photos`, autoload: true });
let users = new Datastore({ filename: `${__dirname}/data/users`, autoload: true });

photos.ensureIndex({fieldName: 'name', unique: true});
users.ensureIndex({fieldName: 'ip', unique: true});

let photosOnDisk = fs.readdirSync(`${__dirname}/public/photos`);

photosOnDisk.forEach((photo) =>
  photos.insert({
    name: photo,
    likes: 0,
    dislikes: 0
  })
);

export default {photos, users};
