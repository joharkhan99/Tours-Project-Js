//.....................THIS FILE IS FOR STARTING THE SERVER........

//some modules
const mongoose = require('mongoose');
const dotenv = require("dotenv");

//for uncaught exceptions like vars r not declared but used
//also put it on top so it can catch all the errors even in app.js
process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION >> Shutting down...');
  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);    //then end whole process
});

dotenv.config({ path: "./config.env" }); //specify path to dotenv so that those vars are added to environment vars
const app = require("./app.js");

//connecting mongodb using mongoose
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); //obtain database string and replace the password from it
mongoose.connect(DB, {  //this connects the database  (if u want to connect to local database use this instaed of DB > process.env.DATABASE_LOCAL)
  useNewUrlParser: true,  //use these as it is
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => console.log('DB connection successful'));//above returns a promise so we handle it here


const port = 5000 || process.env.PORT; //either use the port from config.env or 5000
//listen to port
const server = app.listen(port, () => {
  console.log(`App running on port: ${port}...`);
});

//If programmer commits any mistake like database passwords..
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION >> Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {    //first close the server
    process.exit(1);    //then end whole process
  });
});

//just logging some environment vars from config file
//console.log(process.env);
console.log(process.env.NODE_ENV);



//packages/modules for eslint
/*
npm uninstall eslint eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-ally eslint-plugin-react --save-devnpm uninstall eslint eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-ally eslint-plugin-react --save-dev
*/
