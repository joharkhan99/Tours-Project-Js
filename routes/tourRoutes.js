const express = require('express');
const tourController = require('./../controllers/tourController.js');
const authController = require('./../controllers/authController.js');
const reviewRouter = require('./../routes/reviewRoutes.js');

const tourRouter = express.Router();    //router is a class which helps us to create router handlers

// param middleware to find and extract the id from url
// tourRouter.param('id', tourController.checkID);

//NESTED ROUTES for POST reviews requests

// POST /tour/2332ede/reviews       //reviews is child route of tour route
// GET /tour/54223sd/reviews        (the id is for tour)
//when tour url contain following url then use reviewRouter
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter      //for tour stats
    .route('/tour-stats')
    .get(tourController.getTourStats);
tourRouter      //for tour monthly plan
    .route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);
tourRouter      //for cheap tours
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours); //first is middleware func and the other is getMethod

//route to find tours in a certain distance
// /tours-distance?distance=233&center=-4038,6474&unit=mi
// /tours-within/233/center/-4038,6474/unit/mi      this is better way
tourRouter
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

tourRouter      //routs to find distnaces of all tours from certain tour
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

tourRouter      //to get all tours
    .route('/').get(tourController.getAllTours) //we didn't used protect middleware bcz we maybe other websites also wanna access our API
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);
tourRouter      //for specific tour
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = tourRouter;
