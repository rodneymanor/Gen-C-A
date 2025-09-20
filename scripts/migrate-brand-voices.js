#!/usr/bin/env node

import { getDb as getAdminDb } from '../src/api-routes/utils/firebase-admin.js';
import {
  ensureCreatorLibraryDoc,
  getBrandVoiceDocRef,
  getAnalysesCollectionRef,
  mergeTemplates,
  mergeTranscriptCollections,
  mergeVideoMeta,
  mergeStyleSignature,
  buildAnalysisRecord,
} from '../src/api-routes/utils/brand-voice-store.js';

async function migrateBrandVoices() {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore not initialized. Set Firebase credentials before running the migration.');
  }

  const creatorsSnap = await db.collection('creators').get();
  console.log(`[migration] Found ${creatorsSnap.size} creator documents.`);

  let migratedVoices = 0;

  for (const creatorDoc of creatorsSnap.docs) {
    const creatorData = creatorDoc.data() || {};
    const creatorId = creatorDoc.id;
    const creatorHandle = creatorData.handle || creatorId;
    const creatorName = creatorData.name || creatorHandle;

    await ensureCreatorLibraryDoc(db, creatorId, {
      creatorHandle,
      creatorName,
      niche: creatorData.niche,
    });

    const brandVoicesSnap = await creatorDoc.ref.collection('brandVoices').get();
    if (brandVoicesSnap.empty) continue;

    console.log(`[migration] Creator ${creatorId} has ${brandVoicesSnap.size} brand voice docs.`);

    for (const voiceDoc of brandVoicesSnap.docs) {
      const voiceData = voiceDoc.data() || {};
      const brandVoiceId = voiceData.brandVoiceId || voiceDoc.id;
      const voiceRef = getBrandVoiceDocRef(db, creatorId, brandVoiceId);
      const existingVoiceDoc = await voiceRef.get();
      const existing = existingVoiceDoc.exists ? existingVoiceDoc.data() || {} : {};

      const mergedTemplates = mergeTemplates(existing.templates, voiceData.templates || {}, 'migration');
      const mergedTranscripts = mergeTranscriptCollections(existing.perTranscript, voiceData.perTranscript || []);
      const mergedVideoMeta = mergeVideoMeta(existing.videoMeta, voiceData.videoMeta || []);
      const mergedStyleSignature = mergeStyleSignature(existing.styleSignature, voiceData.styleSignature || {});

      const now = new Date();

      const voicePayload = {
        creatorId,
        brandVoiceId,
        creatorHandle,
        creatorName,
        handle: voiceData.handle || creatorHandle,
        displayName: voiceData.displayName || existing.displayName || creatorName,
        description: voiceData.description || existing.description || `${creatorName} brand voice`,
        templates: mergedTemplates,
        styleSignature: mergedStyleSignature,
        perTranscript: mergedTranscripts,
        videoMeta: mergedVideoMeta,
        analysis: voiceData.analysis || existing.analysis || {},
        latestAnalysisId: voiceData.latestAnalysisId || existing.latestAnalysisId || null,
        analysisCount: typeof existing.analysisCount === 'number'
          ? existing.analysisCount
          : (voiceData.analysis ? 1 : 0),
        transcriptsCount: mergedTranscripts.length,
        niche: voiceData.niche || creatorData.niche || existing.niche || null,
        targetAudience: voiceData.targetAudience || existing.targetAudience || creatorData.niche || 'General',
        keywords: voiceData.keywords || existing.keywords || [],
        platforms: voiceData.platforms || existing.platforms || ['tiktok'],
        isDefault: voiceData.isDefault === true || existing.isDefault === true,
        isShared: voiceData.isShared === true || existing.isShared === true,
        createdAt: existing.createdAt || voiceData.createdAt || creatorData.analysisDate || now,
        updatedAt: now,
      };

      Object.keys(voicePayload).forEach((key) => {
        if (voicePayload[key] === undefined) {
          delete voicePayload[key];
        }
      });

      await voiceRef.set(voicePayload, { merge: true });

      const analysesRef = getAnalysesCollectionRef(db, creatorId, brandVoiceId);
      const legacyAnalysisId = voiceData.latestAnalysisId || `legacy-${voiceDoc.id}`;
      const legacyRecord = buildAnalysisRecord(legacyAnalysisId, {
        createdAt: voiceData.createdAt || creatorData.analysisDate || now,
        savedAt: voiceData.savedAt || creatorData.analysisDate || now,
        transcriptsCount: voiceData.transcriptsCount || mergedTranscripts.length,
        templates: voiceData.templates || {},
        styleSignature: voiceData.styleSignature || {},
        perTranscript: voiceData.perTranscript || [],
        videoMeta: voiceData.videoMeta || [],
        analysis: voiceData.analysis || {},
        source: 'legacy-migration',
      });

      Object.keys(legacyRecord).forEach((key) => {
        if (legacyRecord[key] === undefined) delete legacyRecord[key];
      });

      await analysesRef.doc(legacyAnalysisId).set(legacyRecord, { merge: true });

      migratedVoices += 1;
    }
  }

  console.log(`[migration] Completed. Migrated ${migratedVoices} brand voices into the library.`);
}

migrateBrandVoices().catch((error) => {
  console.error('[migration] Failed to migrate brand voices:', error);
  process.exit(1);
});
