const express = require('express');
const bookingController = require('./../controllers/bookingController.js');
const authController = require('./../controllers/authController.js');

const bookingRouter = express.Router();

//only authenticated user r allowed for actions below this middleware
bookingRouter.use(authController.protect);

bookingRouter.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

//authenticted and only 'admin','lead-guide' below this middleware
bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
    .route('/')
    .get(bookingController.getAllBooking)
    .post(bookingController.createBooking);

bookingRouter
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
