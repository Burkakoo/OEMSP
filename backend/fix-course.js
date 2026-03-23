const mongoose = require('mongoose');
const Course = require('./src/models/Course.ts').default;

async function fixCourse() {
  try {
    await mongoose.connect('mongodb://localhost:27017/oemsp');
    console.log('Connected to MongoDB');
    
    // Update the DATABASE course to be free
    const result = await Course.updateOne(
      { _id: '69b98f10858a27a4d92f7fe1' },
      { $set: { isFree: true } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const course = await Course.findById('69b98f10858a27a4d92f7fe1');
    console.log('Course after update:', { 
      title: course.title, 
      price: course.price, 
      isFree: course.isFree 
    });
    
    mongoose.connection.close();
    console.log('Course fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCourse();
