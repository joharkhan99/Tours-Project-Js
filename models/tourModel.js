const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

//create Schema (schema is like blueprint for a tour) like a constructr

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have name'],  //sec arg is for if name not provided
        unique: true,
        trim: true,  //removes whitespaces from start/end of string
        maxlength: [40, 'A tour name must be less than or equal to 40'],
        minlength: [10, 'A tour name must be more than or equal to 10'],
        /*validator module is not really useful for names bcz it needs 
            to remove spaces too like: 'test tour' is wrong bcz of spacing */
        //validate: [validator.isAlpha, 'Tour name must only contain characters'] //using validator module for validation
    },
    slug: { type: String },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {                 //enum is only for strings
            values: ['easy', 'medium', 'difficult'],    //only these values r allowed for difficulty field
            message: 'Difficulty is either easy, medium, difficult' //if user enters somethig other than these
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,    //if user don't provide rating then this is default
        min: [1, 'A tour must be above 1.0'],
        max: [5, 'A tour must be below 5.0'],
        //set method to set rating to a rounded off value
        set: val => Math.round(val * 10) / 10  //4.6666*10> 46.666> 47/10=4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'], //sec arg is for if name not provided
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {       //custom validator
                //'this' only points to curr doc on NEW doc creation
                return val < this.price;  //priceDiscnt must be less than price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,  //removes whitespaces from start/end of string
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],     //array of images url
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],  //Date is type just like str,num (diff dates for diff tours)
    secretTour: {        //for query middleware
        type: Boolean,
        default: false
    },
    startLocation: {
        //GeoJSON
        type: {             //nested schema
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],   //this expects an array of numbers
        address: String,
        description: String
    },
    locations: [        //array of locations
        {
            type: {             //object for tour locations
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [       //store guides id's in an array
        {
            type: mongoose.Schema.ObjectId,     //new kind of type for ids
            //reference to another model
            ref: 'User'     //this is referencing (will autoly extract info frm userModel altough we didnt imported userModel)
        }
    ]
}, {                            //second argm in schema is for options
    toJSON: { virtuals: true },     //we do these kind of small calc right in the schema
    toObject: { virtuals: true }
});

// when user hit AllTour route then tours will be sorted using below options
// tourSchema.index({ price: 1 })    //1 for ascend, -1 for descend
tourSchema.index({ price: 1, ratingsAverage: -1 })    //1 for ascend, -1 for descend
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });  //special index for tour locations

//virtual prop for calculating duration in weeks
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;       //this is the current document/tour
});

//Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',  //to connect models (field from another model)
    localField: '_id'     //this field is from this model
});

//MIDDLEWARES in mongoose (we can have middlewares before/after certain event)

// Document middleware: it runs before .save() and .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });  //conv name to lowercase and add it to tour
    next(); //as it is middleware so call the next()
});

// Guides Middleware (to find guides for tours by Id and add it to Schema)
// tourSchema.pre('save', async function (next) {
//     //below will be an array full of promises with each guide
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     //await all the above promises
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function (next) {
//     console.log('will save doc....');
//     next();
// });

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });


//QUERRY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {   //all the str that starts with find
    // tourSchema.pre('find', function (next) {
    this.find({ secretTour: { $ne: true } });
    next();

    this.start = Date.now();
});

//MIDDLEWARE to populate users info in guides array in all docs
tourSchema.pre(/^find/, function (next) {       //all queries with find
    this.populate({
        path: 'guides',         //populate guides array with refernce users
        select: '-__v -passwordChangedAt'   //dont show these in output
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} millsec`);
    next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     //make a new stage to filter out secret tours
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //pipeline is an array (unshift to add start of array)

//     console.log(this.pipeline());
//     next();
// });

//created a model of above schema with name Tour
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
