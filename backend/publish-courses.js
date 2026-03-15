/**
 * Script to publish existing courses
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Course schema (simplified)
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructorId: mongoose.Schema.Types.ObjectId,
  category: String,
  level: String,
  price: Number,
  isPublished: Boolean,
  enrollmentCount: Number,
  rating: Number,
  reviewCount: Number,
  createdAt: Date,
  updatedAt: Date,
});

const Course = mongoose.model('Course', courseSchema);

async function publishCourses() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    const result = await Course.updateMany(
      { isPublished: false },
      { $set: { isPublished: true } }
    );

    console.log(`Published ${result.modifiedCount} courses`);

    // Show updated courses
    const courses = await Course.find({}).lean();
    console.log('Updated courses:');
    courses.forEach((c, i) => {
      console.log(`${i+1}. ${c.title} - Category: ${c.category} - Published: ${c.isPublished} - Level: ${c.level}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

publishCourses();