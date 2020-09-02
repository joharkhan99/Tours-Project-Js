const crypto = require('crypto');
const { promisify } = require('util');  //built-in module for creating promises
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {   //creates token string for every user
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

//we will make a func for sending token to user and use it everywhere
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    //some options for cookie
    const cookieOptions = {
        expires: new Date(Date.now() * process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),    //cookie expiration date/time in milisecs
        httpOnly: true  //in this way cookie cant be modified/access by browser
    };

    //add secure option to cookieOptions if user is in production environm
    if (process.env.NODE_ENV == 'production')
        cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);    //send the cookie

    //Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('please provide email and password', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); //the select method will include hashed password as well which was not included before this
    const correct = await user.correctPassword(password, user.password);    //call the correctPas method and pass two passwords for matching

    if (!user || !correct) {    //if user/pass is incorrect
        return next(new AppError('Incorrect email/password', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

//MIDDLEWARE func to protect tours from unlogged users
exports.protect = catchAsync(async (req, res, next) => {
    // 1) getting token and check if it exist
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {  //these r parts of http headers sent by client
        token = req.headers.authorization.split(' ')[1];    //e.g: 'Bearer yuyr343uyu4' >> token = yuyr343uyu4
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You r not logged in! plz log in', 401));  //401 = for unauthorized
    }
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //call the promisify func directly from here

    // 3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user to this token don\'t exist', 401));
    }

    // 4) check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed! plz log in again', 401));
    }

    // Means user is authenticated GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) Verify jwt token in cookie
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); //call the promisify func directly from here

            // 2) check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER. GRANT ACCESS TO TEMPLATES
            res.locals.user = currentUser;
            return next();
        } catch (error) {
            return next();  //if no logged-in user call next middleware
        }
    }
    next();     //if there is no cookie then call next middleware
};

//MIDDLEWARE FUNC TO RESTRICT CERTAIN USERS FROM DELETING TOURS
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array ['admin','lead-guide'], role = 'user'
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform action', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email }); //search user in USERS file
    if (!user) {        //if no user found
        return next(new AppError('No user with this email address', 404));
    }

    // 2) generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });     //will deactivate all validators in our User schema

    // 3) send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sentPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'token sent to email'
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });     //will deactivate all validators in our User schema
        return next(new AppError('error sending to email, try again later!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    //find user in DB based on above token and also check if token has not been expired
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) If token is not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid/expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;    //delete tokens after sending email
    user.passwordResetExpires = undefined;
    await user.save();      //save the doc and we want wnat to validate passwords thats why we r not turning off validators

    // 3) Update changedPasswordAt prop for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current pass is wrong', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will not work bcz we want to save it only and update later

    // 4) Log user in,send JWT
    createSendToken(user, 200, res);
});