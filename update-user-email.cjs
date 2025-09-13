const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

async function updateUserEmail() {
  try {
    console.log('🚀 Starting Firebase user email update...');

    // Load service account
    const serviceAccount = require('./genc-a8f49-firebase-adminsdk-fbsvc-7b158a0d7d.json');
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('🔍 Looking for test user...');

    // Try to find the test user
    let userRecord;
    
    // First try by UID
    try {
      userRecord = await auth.getUser('test-user-super-admin');
      console.log(`✅ Found user by UID: ${userRecord.email}`);
    } catch (error) {
      // Try by old email
      try {
        userRecord = await auth.getUserByEmail('test@example.com');
        console.log(`✅ Found user by email: ${userRecord.email}`);
      } catch (emailError) {
        console.error('❌ Test user not found');
        process.exit(1);
      }
    }

    console.log('📧 Updating email to test@testuser.com...');

    // Update the email
    await auth.updateUser(userRecord.uid, {
      email: 'test@testuser.com',
      emailVerified: true
    });

    console.log('📄 Updating Firestore profile...');

    // Update Firestore document
    await db.collection('users').doc(userRecord.uid).update({
      email: 'test@testuser.com',
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Successfully updated user email!');
    console.log('');
    console.log('🎉 New login credentials:');
    console.log('   Email: test@testuser.com');
    console.log('   Password: testpass');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateUserEmail();