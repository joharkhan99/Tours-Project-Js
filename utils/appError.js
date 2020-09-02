class AppError extends Error {              //inherit this class from Error class
    constructor(message, statusCode) {
        super(message);                     //call the super class (Error) and pass the message str

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);    //for sending error location to user
        //in above this.constructor is theAppError class itself
    }
}

module.exports = AppError;