/**
 * Script to check available categories and levels
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Course schema (simplified)
const courseSchema = new mongoose.Schema({
  title: String,
  category: String,
  level: String,
  isPublished: Boolean,
});

const Course = mongoose.model('Course', courseSchema);

async function checkCategories() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    const courses = await Course.find({ isPublished: true }).lean();
    const categories = [...new Set(courses.map(c => c.category))].sort();
    const levels = [...new Set(courses.map(c => c.level))].sort();

    console.log('Available categories:', categories.join(', '));
    console.log('Available levels:', levels.join(', '));
    console.log('Total published courses:', courses.length);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCategories();