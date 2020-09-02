const mongoose = require('mongoose');
const Tour = require('./tourModel.js');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'review cant be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',                    //reference to Tour model
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',                    //reference to User model
        required: [true, 'Review must belong to a user']
    }
}, {  //second argm in schema is for options and these r not stored in DB
    toJSON: { virtuals: true },     //we do these kind of small calc right in the schema
    toObject: { virtuals: true }
});

// Indexing for tour and user to be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//MIDDLEWARE (populating tour/user in the schema with details instead of just ID's)
reviewSchema.pre(/^find/, function (next) {
    //populating user info in reviews array in output
    this.populate({
        path: 'user',           //field from review Schema
        select: 'name photo'    //output name and photo only
    });
    next();
});

//this function is for average rating for REVIEWS
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },       //total reviews by single user
                avgRating: { $avg: '$rating' }  //avvg of ratings
            }
        }
    ]);
    // console.log(stats);

    if (stats.length > 0) { //stats is an array of reviews rating
        await Tour.findByIdAndUpdate(tourId, {      //update review info in tour
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {      //update review info in tour
            ratingsQuantity: 0,     //defaut 
            ratingsAverage: 4.5     //default
        });
    }
};

//for saving review ratings (also post middleware dont accept next)
reviewSchema.post('save', function () {
    //'this' points to current review
    this.constructor.calcAverageRatings(this.tour);  //constr is curr tour
});

// findByIdAndUpdate
// findByIdAndDelete

// MIDDLEWARE to find rev rating
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.rev = await this.findOne();        //store it to schema obj
    // console.log(this.rev);
    next();
});

// MIDDLEWARE to update review rting in tours
reviewSchema.post(/^findOneAnd/, async function () {
    // await this.findOne();    dosen't work here, query has already executed

    //for calling calcAvgRat for reviews
    await this.rev.constructor.calcAverageRatings(this.rev.tour);
});



const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
