const crypto = require('crypto');       //built-in module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: "default.jpg"
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,     //Date is just type like str,int etc
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false       //don't show this field to user
    }
});

// PRE MIDDLEWARE on SAVE  (for hiding passwords)
userSchema.pre('save', async function (next) {
    // Only run this func if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field bcz we used it in schema and we dont need it
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;    //if user changes pass then update date
    next();
});

//this middleware is when user deletes/deactivate its account
userSchema.pre(/^find/, function (next) {   //all queries starting with find
    // this points to current query
    this.find({ active: { $ne: false } });  //show only users which have active field not equal to false
    next();
});

// For login check passwords if they match in database
// candidatePass = that user give us every time while login
// userPass = the password stored in database
userSchema.methods.correctPassword = async function (candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);   //retrun true if passes r equal
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimeStamp < changedTimeStamp; //the time at which token was created is less than time at which pass was chnged
    }

    // False means password not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    //we are gonna send this token to user for reset password
    const resetToken = crypto.randomBytes(32).toString('hex');  //generate 32 chars random token

    //encrypt the reset token bcz anyone else can use it and then save it to database
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;    //10 mins

    console.log({ resetToken }, this.passwordResetToken);

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
