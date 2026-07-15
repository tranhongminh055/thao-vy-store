// set-cors.js
// Usage:
// 1) Install deps: npm install @google-cloud/storage
// 2) Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON
// 3) node set-cors.js

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const corsPath = path.join(__dirname, 'cors.json');
if (!fs.existsSync(corsPath)) {
  console.error('cors.json not found in this folder.');
  process.exit(1);
}

const corsConfig = JSON.parse(fs.readFileSync(corsPath, 'utf8'));
const bucketName = process.env.BUCKET || 'thao-vy-store.firebasestorage.app';

async function setCors() {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  try {
    await bucket.setMetadata({ cors: corsConfig });
    console.log('✅ CORS configuration applied to', bucketName);
  } catch (err) {
    console.error('Failed to set CORS:', err.message || err);
    process.exit(1);
  }
}

setCors();
