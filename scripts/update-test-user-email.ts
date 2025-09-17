#!/usr/bin/env ts-node

/**
 * Script to update the test user's email to test@testuser.com
 * Usage: npx ts-node scripts/update-test-user-email.ts
 */

import { promises as fs } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Configuration - using the project ID from the existing config
const config = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
            process.env.FIREBASE_PROJECT_ID || 
            process.env.VITE_FIREBASE_PROJECT_ID || 
            'genc-a8f49', // Default from config
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

async function updateTestUserEmail() {
  try {
    console.log('🚀 Starting test user email update...');

    // Validate configuration
    if (!config.projectId || !config.privateKey || !config.clientEmail) {
      console.error('❌ Missing Firebase configuration. Please ensure the following environment variables are set:');
      console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID');
      console.error('- FIREBASE_PRIVATE_KEY');
      console.error('- FIREBASE_CLIENT_EMAIL');
      
      // Try to use the service account file if env vars are not set
      console.log('🔍 Attempting to use service account file...');
      
      try {
        const serviceAccountUrl = new URL('../genc-a8f49-firebase-adminsdk-fbsvc-7b158a0d7d.json', import.meta.url);
        const rawServiceAccount = await fs.readFile(serviceAccountUrl, 'utf-8');
        const serviceAccount = JSON.parse(rawServiceAccount);
        
        if (getApps().length === 0) {
          initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
          });
        }
      } catch (fileError) {
        console.error('❌ Could not load service account file either');
        process.exit(1);
      }
    } else {
      // Initialize Firebase Admin SDK with env vars
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: config.projectId,
            privateKey: config.privateKey,
            clientEmail: config.clientEmail,
          }),
          projectId: config.projectId,
        });
      }
    }

    const auth = getAuth();
    const db = getFirestore();

    // Target user details
    const targetEmail = 'test@testuser.com';
    const testUserUid = 'test-user-super-admin';

    console.log('🔍 Looking for test user...');
    
    let userRecord;
    try {
      // Try to get existing user by UID first
      userRecord = await auth.getUser(testUserUid);
      console.log(`✅ Found user: ${userRecord.email} (${userRecord.uid})`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Try to find user by email
        try {
          userRecord = await auth.getUserByEmail('test@example.com');
          console.log(`✅ Found user by email: ${userRecord.email} (${userRecord.uid})`);
        } catch (emailError: any) {
          console.error('❌ Test user not found. Please run create-test-user.ts first');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    console.log('📧 Updating user email...');
    
    // Update the user's email
    const updatedUser = await auth.updateUser(userRecord.uid, {
      email: targetEmail,
      emailVerified: true
    });

    console.log('📄 Updating user profile in Firestore...');
    
    // Update the user profile in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.update({
      email: targetEmail,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Test user email updated successfully!');
    console.log('');
    console.log('📋 Updated User Details:');
    console.log(`   New Email: ${targetEmail}`);
    console.log(`   Password: testpass (unchanged)`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Display Name: ${updatedUser.displayName || 'Test User'}`);
    console.log('');
    console.log('🎉 You can now log in with:');
    console.log(`   Username: ${targetEmail}`);
    console.log(`   Password: testpass`);

  } catch (error) {
    console.error('❌ Error updating test user email:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  updateTestUserEmail();
}

export { updateTestUserEmail };
