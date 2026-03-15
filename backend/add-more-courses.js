/**
 * Script to add more sample courses for testing
 * Run with: node add-more-courses.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Course schema (simplified)
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  price: { type: Number, required: true, min: 0 },
  thumbnail: { type: String },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  prerequisites: [{ type: String }],
  learningObjectives: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  enrollmentCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Course = mongoose.model('Course', courseSchema);

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
});

const User = mongoose.model('User', userSchema);

const additionalCourses = [
  {
    title: 'React for Beginners',
    description: 'Learn React from scratch and build interactive web applications.',
    category: 'Web Development',
    level: 'beginner',
    price: 59.99,
    prerequisites: ['Basic JavaScript knowledge'],
    learningObjectives: [
      'Understand React components',
      'Manage state and props',
      'Build responsive UIs'
    ],
    isPublished: true,
  },
  {
    title: 'Python Data Analysis',
    description: 'Master data analysis with Python using pandas, numpy, and matplotlib.',
    category: 'Data Science',
    level: 'intermediate',
    price: 74.99,
    prerequisites: ['Python programming basics'],
    learningObjectives: [
      'Work with pandas DataFrames',
      'Create data visualizations',
      'Perform statistical analysis'
    ],
    isPublished: true,
  },
  {
    title: 'Advanced Database Design',
    description: 'Learn advanced database concepts including normalization, indexing, and optimization.',
    category: 'Database',
    level: 'advanced',
    price: 89.99,
    prerequisites: ['Basic SQL knowledge'],
    learningObjectives: [
      'Design efficient database schemas',
      'Implement advanced queries',
      'Optimize database performance'
    ],
    isPublished: true,
  },
  {
    title: 'Mobile App Development with Flutter',
    description: 'Build cross-platform mobile apps using Flutter and Dart.',
    category: 'Mobile Development',
    level: 'intermediate',
    price: 79.99,
    prerequisites: ['Programming fundamentals'],
    learningObjectives: [
      'Create Flutter widgets',
      'Manage app state',
      'Deploy to app stores'
    ],
    isPublished: true,
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Learn the basics of cybersecurity, threats, and protection strategies.',
    category: 'Security',
    level: 'beginner',
    price: 69.99,
    prerequisites: ['Basic computer knowledge'],
    learningObjectives: [
      'Understand security threats',
      'Implement basic security measures',
      'Use encryption techniques'
    ],
    isPublished: true,
  },
  {
    title: 'DevOps with Docker and Kubernetes',
    description: 'Master containerization and orchestration with Docker and Kubernetes.',
    category: 'DevOps',
    level: 'advanced',
    price: 99.99,
    prerequisites: ['Linux and programming experience'],
    learningObjectives: [
      'Containerize applications',
      'Manage Kubernetes clusters',
      'Implement CI/CD pipelines'
    ],
    isPublished: true,
  },
  {
    title: 'Game Development with Unity',
    description: 'Create 2D and 3D games using Unity game engine.',
    category: 'Game Development',
    level: 'intermediate',
    price: 84.99,
    prerequisites: ['Programming basics'],
    learningObjectives: [
      'Design game mechanics',
      'Implement physics',
      'Create game assets'
    ],
    isPublished: true,
  },
  {
    title: 'Cloud Computing with AWS',
    description: 'Learn cloud computing fundamentals using Amazon Web Services.',
    category: 'Cloud Computing',
    level: 'intermediate',
    price: 94.99,
    prerequisites: ['Basic networking knowledge'],
    learningObjectives: [
      'Deploy applications on AWS',
      'Manage cloud resources',
      'Implement security best practices'
    ],
    isPublished: true,
  },
];

async function addMoreCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Find an instructor
    let instructor = await User.findOne({ role: 'instructor' });

    if (!instructor) {
      console.log('ℹ️  No instructor found, creating one...');

      // Hash password
      const hashedPassword = await bcrypt.hash('instructor123', 10);

      instructor = new User({
        email: 'instructor@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'instructor',
        approvalStatus: 'approved',
      });

      await instructor.save();
      console.log('✅ Instructor created:');
      console.log('📧 Email: instructor@example.com');
      console.log('🔑 Password: instructor123');
    }

    // Create additional courses
    const courses = additionalCourses.map(course => ({
      ...course,
      instructorId: instructor._id,
    }));

    await Course.insertMany(courses);

    console.log(`✅ Added ${courses.length} more sample courses successfully!`);
    console.log('\n📚 New courses added:');
    additionalCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} - ${course.category} (${course.level}) - $${course.price}`);
    });

    // Show total courses
    const totalCourses = await Course.countDocuments({ isPublished: true });
    console.log(`\n📊 Total published courses: ${totalCourses}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding courses:', error.message);
    process.exit(1);
  }
}

addMoreCourses();