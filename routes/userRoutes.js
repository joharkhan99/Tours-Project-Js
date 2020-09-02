const express = require('express');
const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');

//router is a class in express which helps us to create router handlers
const userRouter = express.Router();

//we dont need protect middleware for following actions
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);

userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// PROTECT all routes after this MIDDLEWARE > (users need to be logged in)
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.delete('/deleteMe', userController.deleteMe);
userRouter.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

// Allow 'admins' only after this MIDDLEWARE to perform below actions
userRouter.use(authController.restrictTo('admin'));

userRouter
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);
userRouter
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = userRouter;
