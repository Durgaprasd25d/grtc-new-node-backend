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
// POST route to create a new student
router.post(
  "/",
  auth,
  upload.fields([{ name: "profilePic" }, { name: "certificatePic" }]),
  async (req, res) => {
    // Validate request
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
      password, // Add password to the student creation process
    } = req.body;

    try {
      // Check if a student with the given registration number already exists
      let existingStudent = await Student.findOne({ registrationNo });
      if (existingStudent) {
        return res.status(400).json({ message: "Registration number exists" });
      }

      // Create a new student object
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
        password, // Include password in the new student object
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

      // Generate QR code data
      const qrCodeData = await QRCode.toDataURL(
        JSON.stringify({
          name: newStudent.name,
          registrationNo: newStudent.registrationNo,
          course: newStudent.course,
          dateOfBirth: newStudent.dateOfBirth,
        })
      );

      // Assign QR code data to the new student
      newStudent.qrCode = qrCodeData;

      // Save the new student to the database
      await newStudent.save();

      // Send success response
      res.status(201).send("Student created");
    } catch (err) {
      console.error("Error generating QR code or saving student:", err);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;


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
      password, // Include password in the student update process
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
          password, // Include password in the update object
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

router.post("/login", async (req, res) => {
  try {
    const { registrationNo, password } = req.body;

    // Check if registration number and password are provided
    if (!registrationNo || !password) {
      return res
        .status(400)
        .json({ message: "Registration number and password are required" });
    }

    // Find the student by registration number
    const student = await Student.findOne({ registrationNo });

    // If student is not found, return an error
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the provided password matches the stored password
    if (student.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ studentId: student._id }, secret, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Send the token back to the client
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
