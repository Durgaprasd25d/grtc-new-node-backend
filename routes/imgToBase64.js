const express = require('express');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/image-to-base64', upload.single('image'), (req, res) => {
    try {
        // Check if an image file was uploaded
        if (!req.file) {
            return res.status(400).send('No image file uploaded');
        }

        // Read the image file data
        const imageData = req.file.buffer;
        const base64String = imageData.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64String}`;
        res.send(dataUrl);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
