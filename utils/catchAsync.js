//make a func for try/catch purpose and pass an arg
module.exports = fn => {
    return (req, res, next) => {
        //when this whole func is called somewhere then that will also return a promise so we used catch method dhere
        fn(req, res, next).catch(next);     //this func will get called as sooon as new Tour is created
    };
};
