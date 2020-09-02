class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //  1A. Filtering
        const queryObj = { ...this.queryString };    //destructuring (this obj will contain all K:V pairs of url like name='abc', limit=2,rating=2.4)
        const excludedFields = ['page', 'sort', 'limit', 'fields'];    //exclude these in the URL
        excludedFields.forEach(el => delete queryObj[el]);  //delete the el(above fields) from url

        //  1B. Advanced Filtering   (these filters are: gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj); //first conv to js string
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);  // replace for example gt -> $gt in queryStr

        this.query = this.query.find(JSON.parse(queryStr));//parse conv it back to JSON obj and it will find this filter query
        return this;    //entire this object
    }

    sort() {
        //Sorting Results (sorting results accord to price and ratings)
        if (this.queryString.sort) {    //req.query.sort = val of the sort field in url
            const sortBy = this.queryString.sort.split(',').join(' '); //seperate the sort fields by , and then noin by space
            //above e.g: (-price,-ratingsAverage) > (-price -ratingsAverage)
            this.query = this.query.sort(sortBy); //sort the query using above
        } else {
            this.query = this.query.sort('-createdAt');   //else sort by date created (descending order)
        }
        return this;
    }

    limitFields() {
        //Field Limiting (name of things user wanna see)
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            //.select() is a method that selects fields
            this.query = this.query.select(fields);    //selecting certain field names
        } else {
            this.query = this.query.select('-__v');   //'-' is for excluding '__v' field
        }
        return this;
    }

    paginate() {
        //Pagination
        const page = this.queryString.page * 1 || 1; //extract page val from url and conv to int and part after or cond will be default
        const limit = this.queryString.limit * 1 || 100;  //amount of things on one page
        const skip = (page - 1) * limit;    //formula to skip pages / limits

        //page=2&limit=10, 1-10 > page 1, 11-20 > page 2, 21-30 > page3
        this.query = this.query.skip(skip).limit(limit);  //skip(),limit() -> built-in methds

        return this;
    }
}
module.exports = APIFeatures;
