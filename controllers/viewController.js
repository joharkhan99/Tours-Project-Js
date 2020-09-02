const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const User = require('../models/userModel.js');
const Booking = require('../models/bookingModel.js');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1)  Get tour data from collection
    const tours = await Tour.find();    //wil create array of tours

    // 2) Build template
    // 3) Render that template using tour data from step (1)
    res.status(200).render('overview', {   //execute overview.pug on '/' route
        title: 'All Tours',
        tours           //array of tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) get the data, for requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review  rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    // 2) Build template
    // 3) Render template using data from step (1)
    res.status(200).render('tour', {   //execute tour.pug on '/tour' route
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {     //render account.ppug template
        title: 'Your account'
    });
};

exports.getSignUpForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Create an account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);    //make an array of tour ids
    //($in) will select all tours which have an id in the tourIDs array
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours           //only above booked tours are shown in booking tab
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    console.log('UPDATING USER..', req.body);

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).render('account', {     //render account.pug template
        title: 'Your account',
        user: updatedUser       //pass the updated user
    });
});
