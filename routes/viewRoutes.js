const express = require('express');
const viewController = require('../controllers/viewController.js');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const viewRouter = express.Router();

//for executing pug files
viewRouter.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);    //this route will be as a homepage
viewRouter.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
viewRouter.get('/login', authController.isLoggedIn, viewController.getLoginForm);
viewRouter.get('/me', authController.protect, viewController.getAccount);
viewRouter.get('/my-tours', authController.protect, viewController.getMyTours);

viewRouter.post('/signup', authController.signup, viewController.getSignUpForm);
viewRouter.post('/submit-user-data', authController.protect, viewController.updateUserData)

module.exports = viewRouter;
