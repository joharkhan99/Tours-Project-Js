const Tour = require('./../models/tourModel.js');
const catchAsync = require('./../utils/catchAsync.js');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError.js');
const multer = require('multer');   //for uploding files/photos
const sharp = require('sharp');     //for resizing images

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

//Middleware for mix of multiple images
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },        //only 1 image upload allowed
    { name: 'images', maxCount: 3 }         //3 images can e uploaded
]);

/* upload.single('image')    //for only one image   (produces req.file)
   upload.array('images', 5)  //multiple images with same name (produces req.files)
   upload.files([{...}])       //for mix of multiple images  (produces req.files)
*/

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    //if there are no images then move to next middleware
    if (!req.files.imageCover || !req.files.images)
        return next();

    // 1) Cover Image
    //make a new file name and change file name in database
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)      //read the buffer image
        .resize(2000, 1333)       //resize width,height
        .toFormat('jpeg')       //conv every img to .jpeg
        .jpeg({ quality: 90 })  //quality of image
        .toFile(`public/img/tours/${req.body.imageCover}`);   //save it here

    // 2) Images
    req.body.images = [];       //empty array to store images or array of file names

    //i for index means for iterating
    //map will make an array of promises so we use promise.all() to handle it
    await Promise.all(req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer) //read the buffer image
            .resize(2000, 1333)       //resize width,height
            .toFormat('jpeg')       //conv every img to .jpeg
            .jpeg({ quality: 90 })  //quality of image
            .toFile(`public/img/tours/${filename}`);   //save it here
        req.body.images.push(filename);     //add the file/img to array
    }));

    next();
});

//...............DIFFERENT FUNCTIONS and MIDDLEWARE FOR TOURS
exports.aliasTopTours = (req, res, next) => {   //middleware func
    req.query.limit = '5';      //show only 5 tours per page
    req.query.sort = '-ratingsAverage,price';   //show tours with this sort
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';  //show these fields of tours to user
    next(); //use this bcz of middleware func
};

// USE FACTORY HANDLERS/FUNCTIONS
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//AGGREGATION PIPELINE (Tour's statistics)  (using MONGODB for diff stats)
//..........can be found on mongodb documentation site

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([    //below r some stages of aggregation
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },    //will choose the category (like easy,medium,difficult)
                numTours: { $sum: 1 },                  //total tours
                numRatings: { $sum: '$ratingsQuantity' },   //total ratings
                avgRating: { $avg: '$ratingsAverage' }, //avg ratings of tours
                avgPrice: { $avg: '$price' },           //avg of all prices
                minPrice: { $min: '$price' },       //min of all tours
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: {        //sorts the output according to specified field
                avgPrice: 1     //here sort results by avgPrice .... 1 for ascend, -1 for descend
            }
        },
        // we can do more than one stage like below
        // {
        //     $match: {
        //         _id: { $ne: 'EASY' } //shows tours not equal to easy
        //     }
        // }
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;   //get year val from val & conv to int

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'  //will seperate dates for each tour
        },
        {
            $match: {       //for searching tours in given year only
                startDates: {
                    $gte: new Date(`${year}-01-01`),  //first day of year
                    $lte: new Date(`${year}-12-31`)  //last day of year
                }
            }
        },
        {
            $group: {       //group tours using following filters
                _id: { $month: '$startDates' }, //extract month from startdate
                numTourStarts: { $sum: 1 }, //calc total tours in that month by adding 1 each time tour appears in same month
                tours: { $push: '$name' }   //make a list of tour names with same month
            }
        },
        {
            $addFields: { month: '$_id' }   //add value of '_id' to month
        },
        {
            $project: {     //project stage is for showing/hiding fields
                _id: 0      //hide _id field (0=off, 1=on)
            }
        },
        {
            $sort: {
                numTourStarts: -1   //sort tours by total amount of tours
            }
        },
        // {    stage for showing total tours on a page
        //     $limit: 1    in this case it shows only one tour
        // }
    ]);
    res.status(200).json({
        status: "success",
        data: {
            plan
        }
    });
});

//  /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-4038,6474/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;    //destructuring
    const [lat, lng] = latlng.split(',');

    //mi = miles  3963.2,6378.1 = earth radiuses
    //following radius is in radians
    const radius = unit == 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(new AppError('Plz provide latitude and longitude in format lat,lng', 400));
    }

    const tours = await Tour.find({
        //finding locations within certain starting points
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

//      /distances/:latlng/unit/:unit  (below is for this route)
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;    //destructuring
    const [lat, lng] = latlng.split(',');

    //converting distances to miles or kms
    //if user used mi(mies) than conv to miles else conv to kms
    const multiplier = unit == 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('Plz provide latitude and longitude in format lat,lng', 400));
    }

    //aggregate pipeline for some methods
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier  //this will be multiplied with all distances
            }
        },
        {
            $project: {     //show only below and hide other fields in output
                distance: 1,    //1 means kinda true
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});
