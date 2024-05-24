const express = require("express");
const { body, validationResult } = require("express-validator");
const Exam = require("../models/exam");
const auth = require("../middleware/auth");

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

// Get all exams with complete questions
router.get("/", auth, async (req, res) => {
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
//get exam by ID
router.get("/:id", auth, async (req, res) => {
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

module.exports = router;
