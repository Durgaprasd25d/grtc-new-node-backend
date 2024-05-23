const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { body, validationResult } = require("express-validator");
const upload = require("../multer/multer.js"); // Correctly import multer
const Student = require("../models/student.js");
const User = require("../models/user.js");
const auth = require("../middleware/auth");

const router = express.Router();
const secret = "your_jwt_secret";

// Validation middleware

// Create student route
router.post(
  "/",
  auth,
  upload.fields([{ name: "profilePic" }, { name: "certificatePic" }]),
  async (req, res) => {
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
      profilePic:
        req.files && req.files["profilePic"]
          ? req.files["profilePic"][0].path
          : undefined,
      certificatePic:
        req.files && req.files["certificatePic"]
          ? req.files["certificatePic"][0].path
          : undefined,
      user: req.user._id,
    });

    try {
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
      console.error("Error generating QR code:", err);
      res.status(500).send("Failed to generate QR code");
    }
  }
);

// Get all students created by the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [students, totalCount] = await Promise.all([
      Student.find({ user: req.user._id }).skip(skip).limit(limit),
      Student.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      students,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).send("Failed to fetch students");
  }
});

// Update student
router.put(
  "/:id",
  auth,
  upload.fields([{ name: "profilePic" }, { name: "certificatePic" }]),
  async (req, res) => {
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
          profilePic:
            req.files && req.files["profilePic"]
              ? req.files["profilePic"][0].path
              : undefined,
          certificatePic:
            req.files && req.files["certificatePic"]
              ? req.files["certificatePic"][0].path
              : undefined,
        },
        { new: true, runValidators: true }
      );

      if (!student) {
        return res.status(404).send("Student not found");
      }

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
      console.error("Error updating student:", err);
      res.status(500).send("Failed to update student");
    }
  }
);

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
    console.error("Error deleting student:", err);
    res.status(500).send("Failed to delete student");
  }
});

// Get a single student by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).send("Failed to fetch student");
  }
});

router.post("/search/registrationNo", async (req, res) => {
  try {
    const { registrationNo } = req.body; // Use req.body for POST request parameters

    if (!registrationNo) {
      return res
        .status(400)
        .send({ message: "Registration number is required" });
    }

    const student = await Student.findOne({ registrationNo });

    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }

    res.status(200).send(student);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal Server Error", error: error.message });
  }
});
module.exports = router;

module.exports = router;
