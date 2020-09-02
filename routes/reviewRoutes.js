const express = require('express');
const reviewController = require('./../controllers/reviewController.js');
const authController = require('./../controllers/authController.js');

/* by default each router has access to parameters of their specific routes
so we used merge methd to access to other parameter for review in tourRoutes
*/
const reviewRouter = express.Router({ mergeParams: true });

//MIDDLEWARE (no one can access anything without authentication below this middleware)
reviewRouter.use(authController.protect);

reviewRouter
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),  //middleware to alow users only for review
        reviewController.setTourUserIds,    //miiddleware to set user/tour id for review
        reviewController.createReview       //func to create review
    );

reviewRouter
    .route('/:id')
    .get(reviewController.getReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);


module.exports = reviewRouter;

