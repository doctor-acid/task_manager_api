const express = require('express')
const sharp = require('sharp')
const User = require('../models/users')
const { findById } = require('../models/users')
const auth = require('../middleware/authentication')
const multer = require('multer')

const router = new express.Router()

//login
router.post('/users/login', async (req, res) => {
    try{

        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.status(200).send({user , token})
    } catch (e){
        res.status(400).send(e)
    }
})
//LOGOUT
router.post('/users/logout', auth , async (req, res) => {
    console.log(req.user.email)
    try{
        req.user.tokens =  req.user.tokens.filter((token) => {
            token.token !== req.token
        })
        await req.user.save()
        res.send(req.user)
    } catch(e){
        res.status(500).send(e)
    }
})
//LOGOUT All
router.post('/users/logoutAll', auth , async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send(req.user)
    } catch(e){
        res.status(401).send(e)
    }
})
// CREATE USERS/ SIGNUP
router.post('/users/me', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        const token = await user.generateAuthToken()
        console.log('succesfully saved the USER:', user)
        res.status(201).send({user, token})
    } catch(e){
        res.status(400).send(e)
    }

})
//READ Users
router.get('/users/me', auth, async (req, res) => {
  res.status(201).send(req.user)
})
//Update User
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const validUpdates = ['name', 'email', 'password', 'age']
    const isValidUpdate = updates.every((update) => validUpdates.includes(update))

    if(!isValidUpdate){
        return res.status(400).send('Invalid Update!')
    }

    try {
        const user = req.user

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        res.send(user)
    } catch (e) {
        res.status(404).send(e)
    }
})
//Delete User
router.delete('/users/me',auth , async (req, res) => {
    try{
        await req.user.remove()
        res.send(req.user)

    } catch(e){
        res.status(500).send(e)
    }
})

const upload = multer({

    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('please upload an image'))
        }

        cb(undefined, true)
        // cb(new Error('File must be this'))
        // cb(undefined, true)
        // cb(undefined, false)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    
    req.user.avatar = buffer
    await req.user.save()

    res.send()
}, (error, req, res, next) => {
    res.status(400).send({'error': error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({'error': error.message})
})

router.get('/users/:id/avatar', async (req, res) =>{
    try{
        const user = await User.findById(req.params.id)

        if(!user){
            return new Error()
        }

        res.set('Content-Type' ,'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router