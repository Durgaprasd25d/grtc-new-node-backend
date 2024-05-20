const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNo: { type: String, required: true },
  course: { type: String, required: true },
  dateOfAdmission: { type: Date, required: true },
  courseDuration: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  mothersName: { type: String, required: true },
  fathersName: { type: String, required: true },
  address: { type: String, required: true },
  grade: { type: String, required: true },
  profilePic: { type: String },
  certificatePic: { type: String },
  qrCode: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
