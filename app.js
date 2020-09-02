const path = require('path');   //built-in mdule
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');    //for limiting user reqs
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoutes.js');   //tour funcs
const userRouter = require('./routes/userRoutes.js');   //user funcs
const reviewRouter = require('./routes/reviewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');

//Start express app
const app = express();  //this adds a buch of methods to 'app' variable

//FOR PUG TEMPELATES
app.set('view engine', 'pug');      //this is how we use pug template engine
app.set('views', path.join(__dirname, 'views'));    //to locate views folder

//1. GLOBAL MIDDLEWARES

// Serving static files (to access files from browser) (for PUG template)
app.use(express.static(path.join(__dirname, 'public'))); //locate path to access from browser

// Set security HTTP headers    (protection from diff attacks)
app.use(helmet());      //call the helmet func to use it

// Development logging
//(middleware is like bridge btw two things)
//middlewares solves some of our problems itself and link it to our code
if (process.env.NODE_ENV == 'development') { //run these scripts only for if node_env===dev else dont run it
    app.use(morgan('dev')); //You might think of Morgan as a helper that generates request logs. It saves developers time because they don't have to manually create these logs.
};

//MIDDLEWARE FUNC to reduce number of requests from user in an HOUR
const limiter = rateLimit({
    max: 100,                   //100 is max requests
    windowMs: 60 * 60 * 1000,   //in an hpur
    message: 'Too many request from this IP, plz try again in an hour'  //if req exceeds
});
app.use('/api', limiter); //apply limiter to all routes that startswith /api

// Body parser, reading data from body into req.body (modify incoming/out request data)
app.use(express.json({ limit: '10kb' })); //incoming data should be upto 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());        //for reading data from cookie

// Data sanitization/cleaning against NOSQL Query Injection
app.use(mongoSanitize());   //this middleware removes all dollar/dot signs from request string and params

// Data sanitization/cleaning against XSS attacks
app.use(xss()); //removes html symbols/signs from user input request

// Prevent parameter pollution  (if user enters duplicate queres in url)
app.use(hpp({
    // Only allow duplicate queries string for following properties
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

//just for learning purposes
//app.use(express.static(`${__dirname}/public`)); //we do this so that v can access the files in public folder direct from url
//app.use(express.static(`${__dirname}/dev-data`)); without static method we cant access files by using ourl url route

// Testing middleware
app.use((req, res, next) => {   //sample middleware
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

//2. ROUTES

//the below processes is called mount/mounting

app.use('/', viewRouter);       //always run this middleware
app.use('/api/v1/tours', tourRouter);    //middleware for kind of parent url that are present in user and tour modules
app.use('/api/v1/users', userRouter);   //if any url starts with this route then this middleware will be called
app.use('/api/v1/reviews', reviewRouter);   //if any url starts with this route then this middleware will be called
app.use('/api/v1/bookings', bookingRouter); //middleware for booking urls

//below middleware will execute if user enters url other than above ones
app.all('*', (req, res, next) => {      //* = all urls
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//call the global middleware
app.use(globalErrorHandler);

//export it so that server file can access app
module.exports = app;
