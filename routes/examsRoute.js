const express = require('express');
const { body, validationResult } = require('express-validator');
const Exam = require('../models/exam');
const auth = require('../middleware/auth');

const router = express.Router();

// Create an exam
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
], auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description } = req.body;

  try {
    const exam = new Exam({ title, description });
    await exam.save();
    res.status(201).json({ msg: 'Exam created successfully', exam });
  } catch (err) {
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

// Get all exams with complete questions
router.get('/', auth, async (req, res) => {
  try {
    const exams = await Exam.find().populate('questions');
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

module.exports = router;
