Apply CORS to Firebase Storage bucket

Options:

1) Using Google Cloud Console (UI)
- Open https://console.cloud.google.com/storage/browser
- Select bucket: `thao-vy-store.firebasestorage.app` (or `thao-vy-store.appspot.com`)
- Click the bucket → "Edit CORS configuration" → paste the contents of `cors.json` → Save

2) Using gsutil
- Install Google Cloud SDK (https://cloud.google.com/sdk)
- Authenticate: `gcloud auth login`
- Run:
  gsutil cors set cors.json gs://thao-vy-store.firebasestorage.app

3) Using the included Node script (service account required)
- Install dependency:
  npm install @google-cloud/storage
- Export service account key:
  set GOOGLE_APPLICATION_CREDENTIALS=path\\to\\service-account.json
- Optionally set bucket name:
  set BUCKET=thao-vy-store.firebasestorage.app
- Run:
  node set-cors.js

Notes
- Make sure the origin in `cors.json` matches the origin you are using (including scheme).
- After applying CORS, wait a minute and clear browser cache before retrying uploads.
