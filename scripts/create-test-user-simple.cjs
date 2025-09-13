#!/usr/bin/env node

/**
 * Simple script to create test user with super admin permissions
 * This script can be run with basic Node.js without TypeScript compilation
 * 
 * Usage: 
 * 1. Set GOOGLE_APPLICATION_CREDENTIALS env var to path of service account JSON
 * 2. Run: node scripts/create-test-user-simple.js
 * 
 * Or with direct service account JSON:
 * FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/create-test-user-simple.js
 */

const admin = require('firebase-admin');

// Configuration
const PROJECT_ID = 'genc-a8f49'; // From your Firebase config

async function createTestUser() {
  try {
    console.log('🚀 Starting test user creation...');

    // Initialize Firebase Admin SDK
    let app;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Use service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account file path
      app = admin.initializeApp({
        projectId: PROJECT_ID,
      });
    } else {
      console.log('⚠️ No Firebase credentials found.');
      console.log('Either set GOOGLE_APPLICATION_CREDENTIALS to point to your service account JSON file,');
      console.log('or set FIREBASE_SERVICE_ACCOUNT to contain the JSON content directly.');
      console.log('');
      console.log('For now, I\'ll show you the manual steps to create the user...');
      showManualSteps();
      return;
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Test user details
    const testUserData = {
      email: 'test@example.com',
      password: 'testpass',
      displayName: 'Test User',
      uid: 'test-user-super-admin'
    };

    console.log('👤 Creating Firebase Auth user...');
    
    let userRecord;
    try {
      // Try to get existing user first
      userRecord = await auth.getUser(testUserData.uid);
      console.log('✅ User already exists, updating...');
      
      // Update the existing user
      userRecord = await auth.updateUser(testUserData.uid, {
        email: testUserData.email,
        displayName: testUserData.displayName,
        password: testUserData.password
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          uid: testUserData.uid,
          email: testUserData.email,
          password: testUserData.password,
          displayName: testUserData.displayName,
          emailVerified: true
        });
        console.log('✅ Firebase Auth user created successfully');
      } else {
        throw error;
      }
    }

    console.log('🔑 Setting custom claims for super admin permissions...');
    
    // Set custom claims for super admin
    await auth.setCustomUserClaims(testUserData.uid, {
      role: 'super_admin',
      permissions: ['*:*'], // Full permissions
      isSuperAdmin: true
    });

    console.log('📄 Creating user profile in Firestore...');
    
    const now = new Date().toISOString();
    const userProfile = {
      uid: testUserData.uid,
      email: testUserData.email,
      displayName: testUserData.displayName,
      role: 'super_admin',
      permissions: ['*:*'],
      createdAt: now,
      updatedAt: now,
      metadata: {
        isTestUser: true,
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            collections: true
          }
        }
      },
      stats: {
        totalCollections: 0,
        totalVideos: 0,
        storageUsed: 0,
        lastActivity: now
      }
    };

    // Create user profile in Firestore
    await db.collection('users').doc(testUserData.uid).set(userProfile, { merge: true });

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   Email: ${testUserData.email}`);
    console.log(`   Password: ${testUserData.password}`);
    console.log(`   UID: ${testUserData.uid}`);
    console.log(`   Role: super_admin`);
    console.log(`   Permissions: Full access (*:*)`);
    console.log('');
    console.log('🎉 You can now use these credentials to log in with super admin permissions!');

    // Clean up
    await app.delete();

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    
    if (error.code === 'app/no-app') {
      console.log('');
      console.log('This usually means Firebase Admin SDK is not properly initialized.');
      showSetupInstructions();
    }
  }
}

function showManualSteps() {
  console.log('📋 Manual Setup Steps:');
  console.log('');
  console.log('1. Go to Firebase Console (https://console.firebase.google.com)');
  console.log('2. Select project: genc-a8f49');
  console.log('3. Go to Authentication > Users');
  console.log('4. Add user:');
  console.log('   - Email: test@example.com');
  console.log('   - Password: testpass');
  console.log('5. Copy the User UID');
  console.log('6. Go to Firestore Database');
  console.log('7. Create document in "users" collection with the UID as document ID');
  console.log('8. Add these fields:');
  console.log(JSON.stringify({
    email: "test@example.com",
    displayName: "Test User",
    role: "super_admin",
    permissions: ["*:*"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      isTestUser: true,
      preferences: {
        theme: "light",
        language: "en",
        notifications: {
          email: true,
          push: true,
          collections: true
        }
      }
    }
  }, null, 2));
}

function showSetupInstructions() {
  console.log('📖 Setup Instructions:');
  console.log('');
  console.log('1. Get Firebase service account key:');
  console.log('   - Go to Firebase Console > Project Settings > Service accounts');
  console.log('   - Click "Generate new private key"');
  console.log('   - Download the JSON file');
  console.log('');
  console.log('2. Run with credentials:');
  console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
  console.log('   node scripts/create-test-user-simple.js');
  console.log('');
  console.log('   OR set the JSON content directly:');
  console.log('   export FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account",...}\'');
  console.log('   node scripts/create-test-user-simple.js');
}

// Run the script
createTestUser();