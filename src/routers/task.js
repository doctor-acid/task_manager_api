const express = require('express')
const Task = require('../models/tasks')
const auth = require('../middleware/authentication')

const router = new express.Router()

// CREATE Task
router.post('/tasks',auth, async (req, res) => {
 //   const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e){
        res.status(400).send(e)
    }
})
// READ/fetch 
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=30              ==> 4th page
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    console.log(sort)
    try {
        // const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks' ,
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.status(201).send(req.user.tasks)
    } catch(e) {
        res.status(500).send(e)
    }
})
//Read single Task
router.get('/tasks/:id', auth, async (req, res)=> {
    const _id = req.params.id
    try{
        const task = await Task.findOne({ _id, owner: req.user._id})

        if(!task){
            return res.status(404).send('not found')
        }

        res.status(201).send(task)
    } catch (e){
        res.status(400).send(e)
    }
})
//Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const validUpdates = ['completed']
    const isValidUpdate = updates.every((update) => validUpdates.includes(update))

    if(!isValidUpdate){
        return res.status(400).send('Invalid Update!')
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        
        res.send(task)
    } catch (e) {
        res.status(404).send(e)
    }
})
//Delete Task
router.delete('/tasks/:id',auth , async (req, res) => {
    try{
//        const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id: req.params.id , owner: req.user._id})

        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch(e){
        res.status(500).send(e)
    }
})

module.exports = router