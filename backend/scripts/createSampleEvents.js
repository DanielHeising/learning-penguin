const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_penguin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB.'))
.catch(err => console.error('Could not connect to MongoDB...', err));

// Define the Event Schema (same as in index.js)
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

const Event = mongoose.model('Event', eventSchema);

// Sample events data
const sampleEvents = [
  {
    title: 'Math Study Session',
    description: 'Review calculus and linear algebra',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(12, 0, 0, 0)),
    color: '#3788d8',
    allDay: false
  },
  {
    title: 'Programming Workshop',
    description: 'Learn React and Node.js',
    start: new Date(new Date().setDate(new Date().getDate() + 1)),
    end: new Date(new Date().setDate(new Date().getDate() + 1)),
    color: '#28a745',
    allDay: true
  },
  {
    title: 'Group Project Meeting',
    description: 'Discuss project progress and next steps',
    start: new Date(new Date().setDate(new Date().getDate() + 2)),
    end: new Date(new Date().setDate(new Date().getDate() + 2)),
    color: '#dc3545',
    allDay: true
  },
  {
    title: 'Language Practice',
    description: 'Spanish conversation practice',
    start: new Date(new Date().setDate(new Date().getDate() + 3)),
    end: new Date(new Date().setDate(new Date().getDate() + 3)),
    color: '#ffc107',
    allDay: true
  }
];

// Function to create sample events
async function createSampleEvents() {
  try {
    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Insert new events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log('Created sample events:', createdEvents);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating sample events:', error);
    process.exit(1);
  }
}

// Run the script
createSampleEvents(); 