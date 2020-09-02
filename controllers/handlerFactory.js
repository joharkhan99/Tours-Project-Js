const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require('./../utils/apiFeatures.js');

//FUNCTION THAT RETURN ANOTHER FUNCTION
exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {      //if there is no doc found then send this
        return next(new AppError('No document found with that ID', 404));   //if no tour found then it will return this and jump to globalError Middleware
    }

    res.status(204).json({  //show this one if everything is normal
        status: "success",
        requestedAt: req.requestTime,
        data: null      //show null data as its delete method
    });
});

//FUNCTION THAT RETURN ANOTHER FUNCTION
exports.updateOne = (Model) => catchAsync(async (req, res, next) => {
    //first arg=the id v wanna chnge, sec arg=the replacement, third= optional arg for some options
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,      //will always replace the old and create new
        runValidators: true //for validating strings and nums given by user
    });

    if (!doc) {      //if there is no doc found then send this
        return next(new AppError('No document found with that ID', 404));   //if no doc found then it will return this and jump to globalError Middleware
    }

    res.status(200).json({  //else show this one if everything is normal
        status: "success",
        requestedAt: req.requestTime,
        data: {
            data: doc
        }
    });
});

//FUNCTION THAT RETURN ANOTHER FUNCTION
exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    //create new doc and store it in database
    const doc = await Model.create(req.body);    //req.body is user provided thing during POST method

    res.status(201).json({
        status: "success",
        requestedAt: req.requestTime,
        data: {
            data: doc
        }
    });
});

//FUNCTION THAT RETURN ANOTHER FUNCTION
exports.getOne = (Model, populatOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); //req.params.id is to get id from url
    if (populatOptions)
        query = query.populate(populatOptions);     //populate meth will put populate certain fields in schhema/output with info
    const doc = await query;

    if (!doc) {      //if there is no doc found then send this
        return next(new AppError('No document found with that ID', 404));   //if no tour found then it will return this and jump to globalError Middleware
    }

    //send tour in json form
    res.status(200).json({
        status: 'success',
        data: {
            data: doc    //this is above specific doc
        }
    });
});

//FUNCTION THAT RETURN ANOTHER FUNCTION
exports.getAll = (Model) => catchAsync(async (req, res, next) => {

    //to allow for nested GET reviews on tour   (small hack)
    let filter = {};
    if (req.params.tourId)  //if there is tourId then filter obj will store it
        filter = { tour: req.params.tourId }

    //________EXECUTE THE QUERY_______
    //this chaining only works bcz we returned 'this' obj from each meth
    //Tour.find() = query Obj , req.query = query str coming from express
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

    //explain methd gives us some other info
    // const docs = await features.query.explain();

    const docs = await features.query;  //await/execute the query here
    //above query look like this: query.sort().select().skip().limit() >> so we can chain this query as more as we want

    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            data: docs
        }
    });
});