const express = require("express");
const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const secret = "your_jwt_secret";

const router = express.Router();

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
    if (password !== student.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ studentId: student._id }, secret, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Send the token back to the client
    res.status(200).json({ student,token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
