const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Use environment variable or default to '*'
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_penguin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB.'))
.catch(err => console.error('Could not connect to MongoDB...', err));

const pdfSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

// Create a Model from the Schema
const PdfFile = mongoose.model('PdfFile', pdfSchema);

// Create 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // timestamp or unique id?
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Define a Schema for Calendar Events
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  description: { type: String },
  color: { type: String },
  allDay: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Event Model
const Event = mongoose.model('Event', eventSchema);

// Define a Port
const PORT = process.env.PORT || 3000;

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello from Learning Penguin Backend!');
});

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // NEW: Save file metadata to MongoDB
  const newPdfFile = new PdfFile({
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  try {
    await newPdfFile.save();
    res.send(`File uploaded successfully: ${req.file.filename}`);
  } catch (err) {
    console.error('Error saving file metadata to MongoDB:', err);
    res.status(500).send('Error saving file metadata.');
  }
}, (error, req, res, next) => {
  // This is an error handling middleware specifically for Multer errors
  if (error instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    return res.status(500).send(`Multer error: ${error.message}`);
  } else if (error) {
    // An unknown error occurred when uploading.
    return res.status(500).send(`Upload error: ${error.message}`);
  }
  // If it's not a Multer error or our custom fileFilter error, pass it on
  next(error);
});

// List All PDF Files Endpoint
app.get('/pdfs', async (req, res) => {
  try {
    const pdfFiles = await PdfFile.find().sort({ uploadDate: -1 }); // Sort by upload date, newest first
    res.json(pdfFiles);
  } catch (err) {
    console.error('Error fetching PDF files from MongoDB:', err);
    res.status(500).send('Error fetching PDF files.');
  }
});

// Clear All PDF Files Endpoint
app.delete('/pdfs/clear', async (req, res) => {
  try {
    // Get all PDF files before deleting from database
    const pdfFiles = await PdfFile.find();
    
    // Delete each file from the filesystem
    for (const file of pdfFiles) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Error deleting file ${file.path}:`, err);
        }
      });
    }

    // Delete all entries from MongoDB
    await PdfFile.deleteMany({});
    res.send('All PDF files have been cleared from the database and filesystem.');
  } catch (err) {
    console.error('Error clearing PDF files:', err);
    res.status(500).send('Error clearing PDF files.');
  }
});

// Delete Single PDF Endpoint
app.delete('/pdfs/:id/delete', async (req, res) => {
  try {
    const pdfFile = await PdfFile.findById(req.params.id);
    if (!pdfFile) {
      return res.status(404).send('PDF file not found');
    }

    // Delete the file from the filesystem
    const filePath = pdfFile.path;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file from filesystem:', err);
      }
    });

    // Delete the entry from MongoDB
    await PdfFile.findByIdAndDelete(req.params.id);
    res.send('PDF file deleted successfully');
  } catch (err) {
    console.error('Error deleting PDF file:', err);
    res.status(500).send('Error deleting PDF file');
  }
});

// Calendar Event Endpoints

// Get all events
app.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ start: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Error fetching events');
  }
});

// Create new event
app.post('/events', express.json(), async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).send('Error creating event');
  }
});

// Update event
app.put('/events/:id', express.json(), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!event) {
      return res.status(404).send('Event not found');
    }
    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).send('Error updating event');
  }
});

// Delete event
app.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).send('Event not found');
    }
    res.send('Event deleted successfully');
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).send('Error deleting event');
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 