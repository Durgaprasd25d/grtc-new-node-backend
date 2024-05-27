const express = require("express");
const { body, validationResult } = require("express-validator");
const Exam = require("../models/exam");
const Answer = require("../models/answer");
const Question = require("../models/question");
const auth = require("../middleware/auth");
const studentAuth = require("../middleware/studentAuth");
const Student = require("../models/student");

const router = express.Router();

// Create an exam
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    try {
      const exam = new Exam({ title, description });
      await exam.save();
      res.status(201).json({ msg: "Exam created successfully", exam });
    } catch (err) {
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

// Get all exams with complete questions for admin
router.get("/admin", auth, async (req, res) => {
  try {
    const exams = await Exam.find().populate("questions");
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
});

// Get all exams with complete questions for students
router.get("/student", studentAuth, async (req, res) => {
  try {
    const exams = await Exam.find().populate("questions");
    res.status(200).json(exams);
  } catch (err) {
    res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
});

// Update an exam by ID
router.put(
  "/:id",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    try {
      let exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
      }

      exam.title = title;
      exam.description = description;
      await exam.save();

      res.status(200).json({ msg: "Exam updated successfully", exam });
    } catch (err) {
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

// Delete an exam by ID
router.delete("/:id", auth, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
    }

    res.status(200).json({ msg: "Exam deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
});

// Get exam by ID for admin
router.get("/:id/adminId", auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) {
      return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
    }
    res.status(200).json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
});

// Get exam by ID for student
router.get("/:id/studentId", studentAuth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) {
      return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
    }
    res.status(200).json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
});

// Attend an exam
router.post("/:examId/attend", studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) {
      return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== exam.questions.length) {
      return res.status(400).json({ errors: [{ msg: "Invalid answers format" }] });
    }

    const student = req.student;

    // Check if the student has already attended the exam
    if (student.attendedExamsList && student.attendedExamsList.includes(examId)) {
      return res.status(400).json({ errors: [{ msg: "You have already attempted this exam" }] });
    }

    let attendedQuestions = 0;
    let correctAnswers = 0;

    exam.questions.forEach((question, index) => {
      const studentAnswer = answers[index];
      if (!studentAnswer || studentAnswer.questionId.toString() !== question._id.toString()) {
        return res.status(400).json({ errors: [{ msg: "Invalid answer format" }] });
      }
      attendedQuestions++;
      if (studentAnswer.answer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const answerRecord = new Answer({
      student: student._id,
      exam: examId,
      answers,
    });
    await answerRecord.save();

    // Update the student's attended exams
    student.attendedExams += 1;
    if (!student.attendedExamsList) {
      student.attendedExamsList = [];
    }
    student.attendedExamsList.push(examId);
    await student.save();

    res.status(200).json({
      attendedQuestions,
      correctAnswers,
      totalQuestions: exam.questions.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errors: [{ msg: "Failed to submit the exam. Please try again." }] });
  }
});



module.exports = router;
