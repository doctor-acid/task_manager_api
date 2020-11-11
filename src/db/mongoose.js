const mongoose = require('mongoose')
const validator = require('validator')

mongoose.connect(process.env.MONGODB_SERVER, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
