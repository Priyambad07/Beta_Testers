const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, assignTask } = require('../controllers/taskController');

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/assign', assignTask);

module.exports = router;
