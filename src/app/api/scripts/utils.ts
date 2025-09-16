import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import type {
  CollectionReference,
  DocumentSnapshot,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import type { Script } from "@/types/script";
import { getCollectionRefByPath, verifyBearer } from "@/api-routes/utils/firebase-admin.js";

const SCRIPTS_FILE = path.join(process.cwd(), "data", "scripts.json");

function ensureStore() {
  const dir = path.dirname(SCRIPTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCRIPTS_FILE)) {
    fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts: [] }, null, 2));
  }
}

export function readScripts(): Script[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(SCRIPTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Script[];
    if (Array.isArray(parsed?.scripts)) return parsed.scripts as Script[];
    return [];
  } catch {
    return [];
  }
}

export function writeScripts(scripts: Script[]) {
  ensureStore();
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts }, null, 2));
}

export function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function tsToIso(value: unknown, fallbackIso?: string): string {
  try {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  } catch {
    // ignore parsing errors and fall back below
  }
  if (fallbackIso && fallbackIso.trim()) return fallbackIso;
  return new Date().toISOString();
}

export function formatScriptDoc(doc: QueryDocumentSnapshot | DocumentSnapshot): Script {
  const data = doc.data();
  if (!data) {
    throw new Error("Document does not contain data");
  }
  const raw = data as Record<string, unknown>;
  const createdFields = (process.env.CONTENT_CREATED_AT_FIELDS || "createdAt,created,timestamp")
    .split(",")
    .map((s) => s.trim());
  const updatedFields = (process.env.CONTENT_UPDATED_AT_FIELDS || "updatedAt,updated,modifiedAt")
    .split(",")
    .map((s) => s.trim());

  const createdRaw = createdFields.map((key) => raw[key]).find((v) => v != null);
  const fallbackCreated = typeof raw.createdAt === "string" ? raw.createdAt : undefined;
  const createdAt = tsToIso(createdRaw, fallbackCreated);

  const updatedRaw = updatedFields.map((key) => raw[key]).find((v) => v != null);
  const fallbackUpdated = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  const updatedAt = tsToIso(updatedRaw, fallbackUpdated);

  return {
    ...(raw as Script),
    id: doc.id,
    createdAt,
    updatedAt,
  };
}

export async function fetchUserScripts(db: Firestore, uid: string): Promise<Script[]> {
  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
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
          // ignore when the field is missing indexes
        }
        const snapshot = await query.limit(200).get();
        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => formatScriptDoc(doc));
        }
      }
    } catch (error) {
      console.warn("[scripts] configured path query failed:", (error as Error)?.message);
    }
  }

  try {
    const subSnap = await db
      .collection("users")
      .doc(uid)
      .collection("scripts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((doc) => formatScriptDoc(doc));
    }
  } catch {
    // ignore and try root collection next
  }

  for (const userField of ["userId", "uid", "owner"]) {
    try {
      const rootSnap = await db
        .collection("scripts")
        .where(userField, "==", uid)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
      if (!rootSnap.empty) {
        return rootSnap.docs.map((doc) => formatScriptDoc(doc));
      }
    } catch {
      // ignore and continue to the next potential user field
    }
  }

  return [];
}

function buildHeaderMap(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  if (headers.authorization && !headers.Authorization) {
    headers.Authorization = headers.authorization;
  }
  return headers;
}

export interface VerifiedAuth {
  uid: string;
  token: unknown;
}

export async function verifyRequestAuth(request: NextRequest): Promise<VerifiedAuth | null> {
  const headers = buildHeaderMap(request);
  const result = await verifyBearer({ headers } as { headers: Record<string, string> });
  if (result && typeof result.uid === "string") {
    return result as VerifiedAuth;
  }
  return null;
}

export { buildHeaderMap as getRequestHeaders };
