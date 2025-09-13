#!/usr/bin/env ts-node

/**
 * Script to create a test user with super admin permissions
 * Usage: npx ts-node scripts/create-test-user.ts
 */

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

async function createTestUser() {
  try {
    console.log('🚀 Starting test user creation...');

    // Validate configuration
    if (!config.projectId || !config.privateKey || !config.clientEmail) {
      console.error('❌ Missing Firebase configuration. Please ensure the following environment variables are set:');
      console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID');
      console.error('- FIREBASE_PRIVATE_KEY');
      console.error('- FIREBASE_CLIENT_EMAIL');
      process.exit(1);
    }

    // Initialize Firebase Admin SDK
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

    const auth = getAuth();
    const db = getFirestore();

    // Test user details
    const testUserData = {
      email: 'test@example.com',
      password: 'test',
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
    } catch (error: any) {
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

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser();
}

export { createTestUser };