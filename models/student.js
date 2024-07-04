const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNo: { type: String, required: true },
  course: { type: String, required: true },
  dateOfAdmission: { type: Date, required: true },
  courseduration: { type: String, required: true },
  dob: { type: Date, required: true },
  moteherName: { type: String, required: true },
  fatherName: { type: String, required: true },
  address: { type: String, required: true },
  grade: { type: String, required: true },
  profilePic: { type: String },
  certificatepic: { type: String },
  qrCode: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attendedExams: { type: Number, default: 0 },
  attendedExamsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
  password: { type: String },
  hasAssignedExams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }]
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
