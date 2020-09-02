//some modules
const fs = require('fs');
const dotenv = require("dotenv");
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel.js');
const Review = require('./../../models/reviewModel.js');
const User = require('./../../models/userModel.js');


dotenv.config({ path: "./config.env" }); //specify path to dotenv so that those vars are added to environment vars

//connecting mongodb using mongoose
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); //obtain database string and replace the password from it
mongoose.connect(DB, {  //this connects the database  (if u want to connect to local database use this instaed of DB > process.env.DATABASE_LOCAL)
    useNewUrlParser: true,  //use these as it is
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connection successful'));//above returns a promise so we handle it here

//READING JSON FILES
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //conv to js array of objs
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8')); //conv to js array of objs
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')); //conv to js array of objs

//IMPORT DATA INTO DATABASE
const importData = async () => {
    try {
        await Tour.create(tours);       //meth to make tours out of an array
        await User.create(users, { validateBeforeSave: false });       //meth to make users out of an array
        await Review.create(reviews);       //meth to make reviews out of an array
        console.log('data successfully loaded');
    } catch (error) {
        console.log(error);
    }
    process.exit();
};

//DELETE ALL DATA FROM COLLECTION (DATABASE)
const deleteData = async () => {
    try {
        await Tour.deleteMany();        //meth to del tours out of an array
        await User.deleteMany();        //meth to del users out of an array
        await Review.deleteMany();        //meth to del users out of an array
        console.log('data deleted!!');
    } catch (error) {
        console.log(err);
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

/*
process.argv[2] >> the third value in array which is either --import/--delete

    ['D:\\APPS\\node js\\node.exe',
     'E:\\Java Script\\course 3 files\\4. natours\\dev-data\\data\\import-dev-data.js',
     '--import']
if the third val=='--import' then tours r created
if the third val=='--delete' then tours r deleted
*/


