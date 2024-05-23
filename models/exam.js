const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }] // Reference to Question model
});

module.exports = mongoose.model("Exam", examSchema);
