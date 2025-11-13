// backend/scripts/migrateManuscriptDOI.js - Migration script for existing manuscripts
// node backend/scripts/migrateManuscriptDOI.js

const mongoose = require('mongoose');
const Manuscript = require('../src/models/Manuscript');
require('dotenv').config();

const migrateManuscriptDOI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected');

    // Update all manuscripts without doiMetadata
    const result = await Manuscript.updateMany(
      { doiMetadata: { $exists: false } },
      {
        $set: {
          doiMetadata: {
            depositStatus: 'not_assigned',
            depositAttempts: 0,
            depositHistory: []
          }
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} manuscripts`);

    // Generate public URLs for published manuscripts
    const publishedManuscripts = await Manuscript.find({
      status: 'Published',
      publicUrl: { $exists: false }
    });

    console.log(`Found ${publishedManuscripts.length} published manuscripts without public URLs`);

    for (const manuscript of publishedManuscripts) {
      manuscript.generatePublicUrl();
      await manuscript.save();
      console.log(`Generated public URL for ${manuscript.manuscriptId}: ${manuscript.publicUrl}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateManuscriptDOI();
