const Review = require('./../models/reviewModel.js');
//const catchAsync = require('./../utils/catchAsync.js');
const factory = require('./handlerFactory');

//middleware to set tour and user id's and then move to next middeware
exports.setTourUserIds = (req, res, next) => {
    // Allow nested Routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
