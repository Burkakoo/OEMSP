const mongoose = require('mongoose');
require('dotenv').config();

const PlatformSettings = require('./dist/models/PlatformSettings').default;

async function updatePlatformSettings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oemsp');
    console.log('Connected successfully');

    const settings = await PlatformSettings.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          'moderation.requireCourseReviewBeforePublish': false
        }
      },
      { upsert: true, new: true }
    );

    console.log('Platform settings updated:', settings.moderation);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating platform settings:', error);
    process.exit(1);
  }
}

updatePlatformSettings();