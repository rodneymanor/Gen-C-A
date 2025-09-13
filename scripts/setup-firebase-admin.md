# Firebase Admin Setup for Test User Creation

To create the test user with super admin permissions, you need to set up Firebase Admin SDK credentials.

## Steps:

1. **Get Firebase Admin Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `genc-a8f49`
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Set Environment Variables:**
   Create a `.env` file in the project root or set these environment variables:

   ```bash
   export FIREBASE_PROJECT_ID="genc-a8f49"
   export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your private key...\n-----END PRIVATE KEY-----\n"
   export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@genc-a8f49.iam.gserviceaccount.com"
   ```

   Or from the downloaded JSON:
   ```bash
   export FIREBASE_PROJECT_ID="$(cat path/to/serviceAccountKey.json | jq -r '.project_id')"
   export FIREBASE_PRIVATE_KEY="$(cat path/to/serviceAccountKey.json | jq -r '.private_key')"
   export FIREBASE_CLIENT_EMAIL="$(cat path/to/serviceAccountKey.json | jq -r '.client_email')"
   ```

3. **Run the Script:**
   ```bash
   npx ts-node scripts/create-test-user.ts
   ```

## Alternative: Manual User Creation

If you prefer to create the user manually through Firebase Console:

1. Go to Firebase Console > Authentication > Users
2. Add a new user:
   - Email: `test@example.com`
   - Password: `test`
3. Copy the User UID
4. Go to Firestore Database
5. Create a document in the `users` collection with the copied UID as document ID
6. Add the following fields:
   ```json
   {
     "uid": "your-user-uid",
     "email": "test@example.com",
     "displayName": "Test User",
     "role": "super_admin",
     "permissions": ["*:*"],
     "createdAt": "2024-09-12T00:00:00.000Z",
     "updatedAt": "2024-09-12T00:00:00.000Z",
     "metadata": {
       "isTestUser": true,
       "preferences": {
         "theme": "light",
         "language": "en",
         "notifications": {
           "email": true,
           "push": true,
           "collections": true
         }
       }
     },
     "stats": {
       "totalCollections": 0,
       "totalVideos": 0,
       "storageUsed": 0,
       "lastActivity": "2024-09-12T00:00:00.000Z"
     }
   }
   ```

## Test User Credentials

Once created, you can use these credentials:
- **Email:** `test@example.com`
- **Password:** `test`
- **Role:** `super_admin` (full permissions)