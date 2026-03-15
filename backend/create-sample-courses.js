/**
 * Script to create sample courses for testing
 * Run with: node create-sample-courses.js
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

const sampleCourses = [
  {
    title: 'Introduction to Programming',
    description: 'Learn the fundamentals of programming with hands-on examples and projects.',
    category: 'Computer Science',
    level: 'beginner',
    price: 49.99,
    prerequisites: ['Basic computer skills'],
    learningObjectives: [
      'Understand programming concepts',
      'Write basic programs',
      'Debug code effectively'
    ],
    isPublished: true,
  },
  {
    title: 'Advanced JavaScript',
    description: 'Master advanced JavaScript concepts including closures, prototypes, and async programming.',
    category: 'Programming',
    level: 'advanced',
    price: 79.99,
    prerequisites: ['Basic JavaScript knowledge'],
    learningObjectives: [
      'Master closures and scope',
      'Understand prototypes',
      'Work with async/await'
    ],
    isPublished: true,
  },
  {
    title: 'Data Structures and Algorithms',
    description: 'Learn essential data structures and algorithms for efficient programming.',
    category: 'Computer Science',
    level: 'intermediate',
    price: 69.99,
    prerequisites: ['Programming fundamentals'],
    learningObjectives: [
      'Implement common data structures',
      'Analyze algorithm complexity',
      'Solve algorithmic problems'
    ],
    isPublished: true,
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Build modern web applications using HTML, CSS, and JavaScript.',
    category: 'Web Development',
    level: 'beginner',
    price: 39.99,
    prerequisites: ['None'],
    learningObjectives: [
      'Create responsive websites',
      'Use modern CSS techniques',
      'Implement interactive features'
    ],
    isPublished: true,
  },
  {
    title: 'Machine Learning Basics',
    description: 'Introduction to machine learning concepts and practical applications.',
    category: 'Data Science',
    level: 'intermediate',
    price: 89.99,
    prerequisites: ['Statistics and programming'],
    learningObjectives: [
      'Understand ML fundamentals',
      'Implement basic algorithms',
      'Evaluate model performance'
    ],
    isPublished: true,
  },
];

async function createSampleCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Find an instructor (or create one if none exists)
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

    // Check if courses already exist
    const existingCourses = await Course.countDocuments();
    if (existingCourses > 0) {
      console.log(`ℹ️  ${existingCourses} courses already exist. Skipping creation.`);
      console.log('To recreate, delete existing courses first.');
      process.exit(0);
    }

    // Create sample courses
    const courses = sampleCourses.map(course => ({
      ...course,
      instructorId: instructor._id,
    }));

    await Course.insertMany(courses);

    console.log(`✅ Created ${courses.length} sample courses successfully!`);
    console.log('\n📚 Sample courses created:');
    sampleCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} - ${course.category} (${course.level}) - $${course.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample courses:', error.message);
    process.exit(1);
  }
}

createSampleCourses();