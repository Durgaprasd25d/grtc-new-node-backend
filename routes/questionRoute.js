const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const exceljs = require("exceljs");

const Question = require("../models/question");
const Exam = require("../models/exam");

const router = express.Router();

// Set up storage and file filter for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`); // Unique filename
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowedMimeTypes.some((type) => file.mimetype.includes(type))) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images and Excel files (.xlsx) are allowed!"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size to 10MB
});

// Create or bulk-upload questions
router.post(
  "/create_question",
  upload.single("file"),
  [
    body("examId").notEmpty().withMessage("Exam ID is required"),
    body("questionText")
      .optional()
      .notEmpty()
      .withMessage("Question text is required"),
    body("options")
      .optional()
      .isArray({ min: 2 })
      .withMessage("At least two options are required"),
    body("correctAnswer")
      .optional()
      .notEmpty()
      .withMessage("Correct answer is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { examId, questionText, options, correctAnswer } = req.body;

    try {
      // Verify exam existence
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ errors: [{ msg: "Exam not found" }] });
      }

      // Handle bulk upload if file is provided
      if (
        req.file &&
        path.extname(req.file.originalname).toLowerCase() === ".xlsx"
      ) {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const sheet = workbook.getWorksheet(1);

        const questions = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const questionText = row.getCell(1).value;
          const options = [
            row.getCell(2).value,
            row.getCell(3).value,
            row.getCell(4).value,
            row.getCell(5).value,
          ];
          const correctAnswer = row.getCell(6).value;

          if (questionText && options.length >= 2 && correctAnswer) {
            const newQuestion = new Question({
              examId,
              questionText,
              options,
              correctAnswer,
            });
            questions.push(newQuestion);
          }
        });

        // Insert questions into database and update exam
        const createdQuestions = await Question.insertMany(questions);
        exam.questions.push(...createdQuestions.map((q) => q._id));
        await exam.save();

        return res.status(200).json({
          msg: "Questions uploaded successfully",
          questions: createdQuestions,
        });
      }

      // Handle single question creation
      if (questionText && options && correctAnswer) {
        const existingQuestion = await Question.findOne({
          examId,
          questionText,
        });
        if (existingQuestion) {
          return res.status(400).json({
            errors: [{ msg: "Question already exists for this exam" }],
          });
        }

        const question = new Question({
          examId,
          questionText,
          options,
          correctAnswer,
        });
        await question.save();

        exam.questions.push(question._id);
        await exam.save();

        return res
          .status(201)
          .json({ msg: "Question created successfully", question });
      } else {
        return res.status(400).json({
          errors: [{ msg: "Either provide a file or complete question data" }],
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

module.exports = router;
