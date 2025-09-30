import { createRequire } from 'module';
import type { Firestore } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);

interface ScriptsModule {
  ScriptsServiceError: {
    new (message: string, statusCode?: number): ScriptsServiceErrorInstance;
  };
  getScriptsService: (db: Firestore) => ScriptsServiceInstance;
}

export interface ScriptsServiceInstance {
  listScripts(uid: string): Promise<unknown[]>;
  createScript(uid: string, payload: Record<string, unknown>): Promise<unknown>;
  getScriptById(uid: string, scriptId: string): Promise<unknown>;
  updateScript(uid: string, scriptId: string, payload: Record<string, unknown>): Promise<unknown>;
  deleteScript(uid: string, scriptId: string): Promise<void>;
}

export interface ScriptsServiceErrorInstance extends Error {
  statusCode: number;
}

const scriptsModule = require('../../../../src/services/scripts/scripts-service.js') as ScriptsModule;

export const ScriptsServiceError = scriptsModule.ScriptsServiceError;
export const getScriptsService = scriptsModule.getScriptsService;
