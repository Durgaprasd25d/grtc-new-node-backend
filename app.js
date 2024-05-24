const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();  // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const examRoutes = require("./routes/examsRoute");
const questionRoute = require("./routes/questionRoute");
const imageRoute = require("./routes/imgToBase64");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/questions", questionRoute);
app.use("/api", imageRoute); //base64 route ** optional use

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
