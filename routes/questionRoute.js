const express = require("express");
const { body, validationResult } = require("express-validator");
const Question = require("../models/question");
const Exam = require("../models/exam");

const router = express.Router();

// Create a question
router.post(
  "/",
  [
    body("examId").notEmpty().withMessage("Exam ID is required"),
    body("questionText").notEmpty().withMessage("Question text is required"),
    body("options")
      .isArray({ min: 2 })
      .withMessage("At least two options are required"),
    body("correctAnswer").notEmpty().withMessage("Correct answer is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { examId, questionText, options, correctAnswer } = req.body;

    try {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
      }

      // Check for duplicate question
      const existingQuestion = await Question.findOne({ examId, questionText });
      if (existingQuestion) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Question already exists for this exam" }] });
      }

      const question = new Question({
        examId,
        questionText,
        options,
        correctAnswer,
      });
      await question.save();

      // Add question ID to the exam's questions array
      exam.questions.push(question._id);
      await exam.save();

      res.status(201).json({ msg: "Question created successfully", question });
    } catch (err) {
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

module.exports = router;
