const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { body, validationResult } = require("express-validator");

const Student = require("../models/student.js");
const User = require("../models/user.js");
const auth = require("../middleware/auth");

const router = express.Router();
const secret = "your_jwt_secret";

// Validation middleware
const validateStudent = [
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
  body("registrationNo").notEmpty().withMessage("Registration number is required").trim().escape(),
  body("course").notEmpty().withMessage("Course is required").trim().escape(),
  body("dateOfAdmission").notEmpty().withMessage("Date of admission is required").trim().escape(),
  body("courseDuration").notEmpty().withMessage("Course duration is required").trim().escape(),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required").trim().escape(),
  body("mothersName").notEmpty().withMessage("Mother's name is required").trim().escape(),
  body("fathersName").notEmpty().withMessage("Father's name is required").trim().escape(),
  body("address").notEmpty().withMessage("Address is required").trim().escape(),
  body("grade").notEmpty().withMessage("Grade is required").trim().escape(),
];

// Create student
router.post("/", auth, validateStudent, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    registrationNo,
    course,
    dateOfAdmission,
    courseDuration,
    dateOfBirth,
    mothersName,
    fathersName,
    address,
    grade,
    profilePic,
    certificatePic,
  } = req.body;

  const newStudent = new Student({
    name,
    registrationNo,
    course,
    dateOfAdmission,
    courseDuration,
    dateOfBirth,
    mothersName,
    fathersName,
    address,
    grade,
    profilePic,
    certificatePic,
    user: req.user._id,
  });

  try {
    // Generate QR Code with only specified data
    const qrCodeData = await QRCode.toDataURL(
      JSON.stringify({
        name: newStudent.name,
        registrationNo: newStudent.registrationNo,
        course: newStudent.course,
        dateOfBirth: newStudent.dateOfBirth,
      })
    );

    newStudent.qrCode = qrCodeData;
    await newStudent.save();
    res.status(201).send("Student created");
  } catch (err) {
    console.error("Error generating QR code:", err); // Log the specific error
    res.status(500).send("Failed to generate QR code");
  }
});


// Get all students created by the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default limit is 10

    // Calculate skip based on page and limit
    const skip = (page - 1) * limit;

    // Fetch students and total count
    const [students, totalCount] = await Promise.all([
      Student.find({ user: req.user._id }).skip(skip).limit(limit),
      Student.countDocuments({ user: req.user._id })
    ]);

    // Response with pagination metadata
    res.json({
      students,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).send("Failed to fetch students");
  }
});


// Update student
router.put("/:id", auth, validateStudent, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    registrationNo,
    course,
    dateOfAdmission,
    courseDuration,
    dateOfBirth,
    mothersName,
    fathersName,
    address,
    grade,
    profilePic,
    certificatePic,
  } = req.body;

  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        name,
        registrationNo,
        course,
        dateOfAdmission,
        courseDuration,
        dateOfBirth,
        mothersName,
        fathersName,
        address,
        grade,
        profilePic,
        certificatePic,
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).send("Student not found");
    }

    // Generate new QR Code
    const qrCodeData = await QRCode.toDataURL(
      JSON.stringify({
        name: student.name,
        registrationNo: student.registrationNo,
        course: student.course,
        dateOfBirth: student.dateOfBirth,
      })
    );

    student.qrCode = qrCodeData;
    await student.save();

    res.json(student);
  } catch (err) {
    console.error("Error updating student:", err); // Log the specific error
    res.status(500).send("Failed to update student");
  }
});

// Delete student
router.delete("/:id", auth, async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.status(200).send("Student deleted");
  } catch (err) {
    console.error("Error deleting student:", err); // Log the specific error
    res.status(500).send("Failed to delete student");
  }
});

// Get a single student by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).send("Failed to fetch student");
  }
});


module.exports = router;
