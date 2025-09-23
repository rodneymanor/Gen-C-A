declare module '@/api-routes/utils/firebase-admin.js' {
  export function getDb(): FirebaseFirestore.Firestore | null;
  export function getCollectionRefByPath(
    db: FirebaseFirestore.Firestore | null,
    pathTemplate: string,
    uid?: string
  ): FirebaseFirestore.CollectionReference | null;
  export function verifyBearer(
    req: { headers: Record<string, string | string[] | undefined> }
  ): Promise<{ uid: string; token: Record<string, unknown> } | null>;
}
