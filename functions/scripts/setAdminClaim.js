/**
 * Set admin custom claim for a user by email using Firebase Admin SDK.
 *
 * Usage:
 *   set GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
 *   node scripts/setAdminClaim.js user@example.com
 */

const admin = require('firebase-admin');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/setAdminClaim.js user@example.com');
    process.exit(2);
  }

  try {
    // Initialize Admin SDK using Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }

    console.log('Looking up user by email:', email);
    const userRecord = await admin.auth().getUserByEmail(email).catch(async (err) => {
      if (err && err.code === 'auth/user-not-found') {
        console.log('User not found in Auth. Creating user with no password...');
        return await admin.auth().createUser({ email });
      }
      throw err;
    });

    console.log('Setting custom claim {admin: true} for uid:', userRecord.uid);
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    // Also ensure Firestore user doc has role: 'admin'
    try {
      const db = admin.firestore();
      await db.collection('users').doc(email).set({ role: 'admin' }, { merge: true });
      console.log('Updated Firestore users doc with role=admin');
    } catch (e) {
      console.warn('Failed to update Firestore doc:', e.message || e);
    }

    console.log('Done. The user now has admin claim. They may need to sign out and sign in again to refresh ID token.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting admin claim:', err);
    process.exit(1);
  }
}

main();
