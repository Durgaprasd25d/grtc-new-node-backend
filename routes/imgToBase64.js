const express = require("express");
const multer = require("multer");
const cloudinary = require("../multer/cloudinaryConfig");

const router = express.Router();

// Set up multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST endpoint to upload an image to Cloudinary with a category
router.post("/upload-image", upload.single("image"), (req, res) => {
  // Check if the image and category were provided
  if (!req.file) {
    return res.status(400).send("No image file uploaded");
  }
  if (!req.body.image_category) {
    return res.status(400).send("Image category is required");
  }

  // Get the category from the request body
  const category = req.body.image_category;

  // Upload the image to Cloudinary
  cloudinary.uploader
    .upload_stream(
      {
        folder: "uploads",
        public_id: `${category}/${Date.now()}_${req.file.originalname}`, // Ensure category is part of public_id
      },
      (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          return res.status(500).send("Cloudinary upload failed");
        }
        res.json({
          message: "Image uploaded successfully",
          url: result.secure_url,
          category: category,
        });
      }
    )
    .end(req.file.buffer); // Send the file buffer to Cloudinary
});

// GET endpoint to fetch all images from Cloudinary (without parameters)
router.get("/get-images", (req, res) => {
  // Retrieve query parameters with default values
  const folder = req.query.folder || "uploads"; // Default to 'uploads' if no folder is provided
  const category = req.query.category || null; // Optional category filter
  const maxResults = parseInt(req.query.max_results) || 100; // Default to 100 if not provided
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const offset = (page - 1) * maxResults; // Calculate the offset based on page number

  // Prepare the options object for Cloudinary API
  let options = {
    type: "upload",
    prefix: folder, // Folder to list images from
    resource_type: "image", // Only fetch images
    max_results: maxResults, // Max number of images to fetch
    start: offset, // Pagination offset
  };

  // If category is provided, filter by category
  if (category) {
    options.prefix = `${folder}/${category}`; // Add category as part of the prefix
  }

  // List images from Cloudinary based on the options
  cloudinary.api.resources(options, (error, result) => {
    if (error) {
      console.error("Error fetching images from Cloudinary:", error);
      return res.status(500).send("Error fetching images");
    }

    // Map the results to extract image URLs and public IDs
    const images = result.resources.map((resource) => ({
      public_id: resource.public_id,
      url: resource.secure_url,
    }));

    // Send the list of image URLs in the response
    res.json({
      message: "Images fetched successfully",
      images: images,
      total_images: result.total_count, // Total number of images (for pagination)
      page,
      max_results: maxResults,
    });
  });
});

// POST endpoint to bulk upload images to Cloudinary with a category
router.post("/bulk-images", upload.array("images"), (req, res) => {
  const { image_category } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No image files uploaded");
  }
  if (!image_category) {
    return res.status(400).send("Image category is required");
  }

  // Upload each image to Cloudinary
  const uploadPromises = req.files.map(
    (file) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "uploads",
              public_id: `${image_category}/${Date.now()}_${file.originalname}`,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id,
                  category: image_category,
                });
              }
            }
          )
          .end(file.buffer); // Send the file buffer to Cloudinary
      })
  );

  // Wait for all uploads to complete
  Promise.all(uploadPromises)
    .then((uploadedImages) => {
      res.json({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    })
    .catch((error) => {
      console.error("Error uploading images to Cloudinary:", error);
      res.status(500).send("Bulk upload failed");
    });
});

// DELETE endpoint to handle both single and multiple image deletions from Cloudinary by public_id(s)
router.delete("/delete-images", async (req, res) => {
  let { public_ids } = req.body; // Expecting an array of public IDs or a single public ID

  // If the request contains a single public_id, wrap it in an array for consistency
  if (!Array.isArray(public_ids)) {
    public_ids = [public_ids]; // Single public_id case
  }

  if (public_ids.length === 0) {
    return res.status(400).send("At least one public ID is required for deletion.");
  }

  try {
    // Use Promise.all to delete all images concurrently
    const deleteResults = await Promise.all(
      public_ids.map((id) =>
        cloudinary.uploader.destroy(id)
          .then((result) => ({ id, result }))
          .catch((error) => ({ id, error }))
      )
    );

    // Separate successful and failed deletions for a detailed response
    const successfulDeletions = deleteResults.filter((res) => !res.error);
    const failedDeletions = deleteResults.filter((res) => res.error);

    res.json({
      message: "Deletion process completed",
      deleted: successfulDeletions.map((item) => item.id),
      failed: failedDeletions.map((item) => ({
        id: item.id,
        error: item.error.message,
      })),
    });
  } catch (error) {
    console.error("Error deleting images:", error);
    res.status(500).send("Image deletion process encountered an error");
  }
});

module.exports = router;
