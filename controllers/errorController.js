const AppError = require("./../utils/appError.js");

const handleCastErrorDB = err => {
    const msg = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(msg, 400);      //400: bad request
};
const handleJWTError = () => new AppError('Invalid token. Please log in again', 401);

const handleJWTExpireError = () => new AppError('Your token has expired! plz log in again', 401);

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({           //send the error
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // B) RENDERED WEBSITE
    console.error('ERROR: ', err);

    return res.status(err.statusCode).render('error', {  //render 'error.pug' template in case of error
        title: 'Something went wrong!',
        msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // A) Operational, trusted/user error: send msg to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({           //send the error
                status: err.status,
                message: err.message,
            });
        }
        // B) Programming or other unknown error: don't leak details to client
        // 1) log error to console
        console.error('ERROR: ', err);

        // 2) Send generic msg
        return res.status(500).json({
            status: "Error",
            message: 'Something went very wrong'
        });
    }
    // B) RENDERED WEBSITE
    // A) Operational, trusted/user error: send msg to client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {   //render 'error.pug' template
            status: err.status,
            msg: err.message,
        });
    }
    // B) Programming or other unknown error: don't leak details to client
    // 1) log error to console
    console.error('ERROR: ', err);

    // 2) Send generic msg
    return res.status(err.statusCode).render('error', {
        title: "Something went wrong!",
        msg: 'Please try again later.'
    });
};

//GLOBAL MIDDLEWARE to handle diff errors
module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;     //either func statuscode or 500
    err.status = err.status || 'error';         //either func err or 'error'

    if (process.env.NODE_ENV == 'development') {        //for dev scripts
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV == 'production') {      //for prod script
        let error = { ...err };     //destructuring of original above error(err)
        error.message = err.message;

        //if our error is cast error then..
        if (error.name == 'CastError') error = handleCastErrorDB(error);
        if (error.name == 'JsonWebTokenError') error = handleJWTError();
        if (error.name == 'TokenExpiredError') error = handleJWTExpireError();

        sendErrorProd(error, req, res);
    }
};
