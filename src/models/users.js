const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./tasks')


const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }, 
    email: {
        type: String,
        reqired: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        required : true,
        minlength: 6,
        trim : true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('please enter a valid password. "password" is not valid')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},
{
    timestamps: true
})

UserSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

UserSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
        console.log(user.password)
    }

    next()
    console.log('this works bro')
})

UserSchema.statics.findByCredentials = async (email, password) => {
   
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to find User or Password')
    }
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Username or Password not found')
    }
    return user
}

UserSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

UserSchema.methods.generateAuthToken = async function(){
    const user = this

    const token = jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn : '1 week'})

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token

}

UserSchema.pre('remove', async function (next){
    const user = this
    await Task.deleteMany({ owner: user._id})

    next()
})

const User = mongoose.model('User', UserSchema)

module.exports = User