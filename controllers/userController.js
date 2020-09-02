// const fs = require('fs');
const User = require('./../models/userModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory');
const multer = require('multer');   //for uploding files/photos
const sharp = require('sharp');     //for resizing images

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {       //cb=callback function
//         cb(null, 'public/img/users');       //store new uploaded image here
//     },
//     filename: (req, file, cb) => {          //cb=callback function
//         const ext = file.mimetype.split('/')[1];    //image extension
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);//new name to file  user-123wwqe32-23123324.jpeg
//     }
// });

//image will be stored as buffer and will not be stored to file directly
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {       //cb=callback function
    if (file.mimetype.startsWith('image')) {
        cb(null, true);                     //if evrythng ok pass true to callback
    } else {
        cb(new AppError('Not an image. plz upload image', 400), false);
    }
}

//so now create an upload by specifying storage and filter
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

//Upload MIddleware (upload.single bcz we want to upload one single image)
exports.uploadUserPhoto = upload.single('photo');

//MIDDLEWARE TO RESIZE USER UPLOADED IMAGE
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file)        //if user haavent uploaded any file/image
        return next();

    //Make a file name for the image/file/pics
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;   //user-123wwqe32-23123324.jpeg

    //await this so that this process happens in bg and completes on time
    await sharp(req.file.buffer)      //read the buffer image
        .resize(500, 500)       //resize width,height
        .toFormat('jpeg')       //conv every img to .jpeg
        .jpeg({ quality: 90 })  //quality of image
        .toFile(`public/img/users/${req.file.filename}`);   //save it here

    next();
});

//this func is for user to allow him to update only certain fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {        //loop trough user obj
        if (allowedFields.includes(el))     //if allowFlds array contains obj el
            newObj[el] = obj[el];           //then store it in newObj
    });
    return newObj;
};

//MIDDLEWARE    (will set param id to user id which wil output curr user)
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

//...............DIFFERENT FUNCTIONS FOR USERS
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {    //if user provides password/passconfrm then give error
        return next(new AppError('This route is not for passwords update. Please use /updateMyPassword.', 400));
    }

    // 2) filter out unwanted fieldnames that r not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;   //add photo property to filteredBody

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,          //make a new user
        runValidators: true //also run validators
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "this route is not defined! plz use /signup instead"
    });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    //find user by id and set its active field to false (active field is in user schema)
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: "success",
        data: null              //dont send any data
    });
});

//USING FACTORY HANNDLERS/FUNCTIONS
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);// Do NOT update passwords with this
exports.deleteUser = factory.deleteOne(User);   //call factory func and pass model


