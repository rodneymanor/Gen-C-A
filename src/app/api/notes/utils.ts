import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { getCollectionRefByPath } from "@/api-routes/utils/firebase-admin.js";

export type NoteRecord = Record<string, unknown> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
};

function tsToIso(value: unknown, fallbackIso?: string): string {
  try {
    if (value && typeof value === "object" && "toDate" in value) {
      const candidate = value as { toDate?: () => Date };
      if (typeof candidate.toDate === "function") {
        return candidate.toDate().toISOString();
      }
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  } catch {
    // ignore parsing errors and fall back below
  }
  if (fallbackIso && fallbackIso.trim()) {
    return fallbackIso;
  }
  return new Date().toISOString();
}

export function formatNoteDoc(doc: QueryDocumentSnapshot | DocumentSnapshot): NoteRecord {
  const data = doc.data();
  const raw = (data || {}) as Record<string, unknown>;

  const createdFields = (process.env.CONTENT_CREATED_AT_FIELDS || "createdAt,created,timestamp")
    .split(",")
    .map((field) => field.trim());
  const updatedFields = (process.env.CONTENT_UPDATED_AT_FIELDS || "updatedAt,updated,modifiedAt")
    .split(",")
    .map((field) => field.trim());

  const createdRaw = createdFields.map((key) => raw[key]).find((value) => value != null);
  const fallbackCreated = typeof raw.createdAt === "string" ? (raw.createdAt as string) : undefined;
  const createdAt = tsToIso(createdRaw, fallbackCreated);

  const updatedRaw = updatedFields.map((key) => raw[key]).find((value) => value != null);
  const fallbackUpdated = typeof raw.updatedAt === "string" ? (raw.updatedAt as string) : createdAt;
  const updatedAt = tsToIso(updatedRaw, fallbackUpdated);

  return {
    ...raw,
    id: doc.id,
    createdAt,
    updatedAt,
  } as NoteRecord;
}

export async function fetchUserNotes(db: Firestore, uid: string): Promise<NoteRecord[]> {
  const configuredPath = process.env.CONTENT_NOTES_PATH;
  if (configuredPath) {
    try {
      const ref = getCollectionRefByPath(db, configuredPath, uid) as CollectionReference | null;
      if (ref) {
        let query: Query = ref;
        if (!configuredPath.includes("{uid}")) {
          const userField = process.env.CONTENT_USER_FIELD || "userId";
          query = query.where(userField, "==", uid);
        }
        try {
          query = query.orderBy("createdAt", "desc");
        } catch {
          // ignore when index is missing
        }
        const snapshot = await query.limit(200).get();
        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => formatNoteDoc(doc));
        }
      }
    } catch (error) {
      console.warn("[notes] configured path query failed:", (error as Error)?.message);
    }
  }

  try {
    const subSnap = await db
      .collection("users")
      .doc(uid)
      .collection("notes")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((doc) => formatNoteDoc(doc));
    }
  } catch {
    // ignore and try root collection next
  }

  for (const userField of ["userId", "uid", "owner"]) {
    try {
      const rootSnap = await db
        .collection("notes")
        .where(userField, "==", uid)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
      if (!rootSnap.empty) {
        return rootSnap.docs.map((doc) => formatNoteDoc(doc));
      }
    } catch {
      // ignore and continue to the next candidate field
    }
  }

  return [];
}

export async function persistNote(
  db: Firestore,
  uid: string,
  note: Record<string, unknown>,
): Promise<NoteRecord> {
  const timestamps = { createdAt: new Date(), updatedAt: new Date() } as const;
  const payload = {
    ...note,
    userId: uid,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  } as Record<string, unknown>;

  const configuredPath = process.env.CONTENT_NOTES_PATH;
  const configuredRef = configuredPath ? getCollectionRefByPath(db, configuredPath, uid) : null;
  if (configuredRef) {
    const ref = await (configuredRef as CollectionReference).add(payload);
    return {
      ...note,
      id: ref.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    } as NoteRecord;
  }

  try {
    const subRef = await db
      .collection("users")
      .doc(uid)
      .collection("notes")
      .add(payload);
    return {
      ...note,
      id: subRef.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    } as NoteRecord;
  } catch {
    const ref = await db.collection("notes").add(payload);
    return {
      ...note,
      id: ref.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    } as NoteRecord;
  }
}

export async function resolveNoteDocRef(
  db: Firestore,
  uid: string,
  id: string,
): Promise<DocumentReference | null> {
  let docRef: DocumentReference | null = db
    .collection("users")
    .doc(uid)
    .collection("notes")
    .doc(id);
  let snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  docRef = db.collection("notes").doc(id);
  snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  const configuredPath = process.env.CONTENT_NOTES_PATH;
  if (configuredPath) {
    const collection = getCollectionRefByPath(db, configuredPath, uid) as CollectionReference | null;
    if (collection) {
      try {
        const configuredDoc = collection.doc(id);
        const configuredSnapshot = await configuredDoc.get();
        if (configuredSnapshot.exists) {
          return configuredDoc;
        }
      } catch (error) {
        console.warn(
          "[notes] resolveNoteDocRef configured path failed:",
          (error as Error)?.message,
        );
      }
    }
  }

  return null;
}

export async function findNoteById(
  db: Firestore,
  uid: string,
  id: string,
): Promise<NoteRecord | null> {
  const docRef = await resolveNoteDocRef(db, uid, id);
  if (!docRef) {
    return null;
  }
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }
  return formatNoteDoc(snapshot);
}
