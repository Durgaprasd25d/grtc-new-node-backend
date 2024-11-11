const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const studentAuthRoute = require("./routes/studentAuth");
const examRoutes = require("./routes/examsRoute");
const questionRoute = require("./routes/questionRoute");
const imageRoute = require("./routes/imgToBase64");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const allowedOrigins = [
  "https://gurukrupa-admin.netlify.app",
  "https://grtc-institute.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in the allowedOrigins array
    if (allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request if origin is in allowedOrigins
    } else {
      // Optionally allow any origin or reject based on your needs
      callback(new Error("Not allowed by CORS")); // Reject if origin is not allowed
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable if cookies or authorization headers are needed
};

app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentAuthRoute);
app.use("/api/students", studentRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/questions", questionRoute);
app.use("/api", imageRoute); //base64 route ** optional use

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
