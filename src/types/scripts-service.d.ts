declare module '@/services/scripts/scripts-service.js' {
  export interface ScriptRecord {
    id: string;
    userId?: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  }

  export class ScriptsServiceError extends Error {
    constructor(message: string, statusCode?: number);
    statusCode: number;
  }

  export class ScriptsService {
    constructor(firestore: FirebaseFirestore.Firestore);
    listScripts(userId: string): Promise<ScriptRecord[]>;
    createScript(userId: string, payload: Record<string, unknown>): Promise<ScriptRecord>;
    getScriptById(userId: string, scriptId: string): Promise<ScriptRecord>;
    updateScript(userId: string, scriptId: string, payload: Record<string, unknown>): Promise<ScriptRecord>;
    deleteScript(userId: string, scriptId: string): Promise<void>;
  }

  export function getScriptsService(
    firestore: FirebaseFirestore.Firestore
  ): ScriptsService;
  export function formatScriptDoc(doc: FirebaseFirestore.DocumentSnapshot): ScriptRecord;
  export function fetchUserScripts(
    db: FirebaseFirestore.Firestore,
    uid: string
  ): Promise<ScriptRecord[]>;
  export function persistScript(
    db: FirebaseFirestore.Firestore,
    uid: string,
    script: Record<string, unknown>
  ): Promise<ScriptRecord>;
  export function resolveScriptDocRef(
    db: FirebaseFirestore.Firestore,
    uid: string,
    id: string
  ): Promise<FirebaseFirestore.DocumentReference | null>;
  export function findScriptById(
    db: FirebaseFirestore.Firestore,
    uid: string,
    id: string
  ): Promise<ScriptRecord | null>;
}
