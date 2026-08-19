/**
 * transcoder/src/runtime/cleanup.js
 *
 * CLI Executable for Safe HLS Cleanup & Retention Policy Enforcement.
 * Default execution mode: READ-ONLY PREVIEW.
 * Use --apply flag to execute non-destructive cleanup of eligible temporary files.
 */

import fs from 'fs';
import { evaluateRetentionPolicy } from '../recovery/retentionPolicy.js';
import { cleanupTempHlsDir } from '../paths.js';

async function runCleanupCli() {
  const isApply = process.argv.includes('--apply');

  console.log(`\n========================================`);
  console.log(`PF SPACE HLS CLEANUP ${isApply ? 'EXECUTION' : 'PREVIEW'}`);
  console.log(`========================================`);

  const report = evaluateRetentionPolicy();

  console.log(`\nEligible for Cleanup (${report.eligibleForCleanup.length}):`);
  if (report.eligibleForCleanup.length === 0) {
    console.log(`  (None)`);
  } else {
    report.eligibleForCleanup.forEach((item) => {
      console.log(`  - ${item.name} (${(item.ageMs / 60000).toFixed(1)} mins old)`);
    });
  }

  console.log(`\nProtected HLS Outputs (${report.protectedHls.length}):`);
  report.protectedHls.forEach((item) => {
    console.log(`  - ${item.name} [${item.reason}]`);
  });

  console.log(`\nSource MP4 Files (${report.protectedSourceMp4s.length}):`);
  console.log(`  - PROTECTED (Source MP4s are NEVER deleted)`);

  console.log(`========================================`);

  if (!isApply) {
    console.log(`ℹ️ Mode: READ-ONLY PREVIEW. No files deleted.\nTo apply cleanup, run: node src/runtime/cleanup.js --apply\n`);
    process.exit(0);
  }

  // Apply Mode: Remove ONLY eligible files
  let deletedCount = 0;
  for (const item of report.eligibleForCleanup) {
    try {
      cleanupTempHlsDir(item.fullPath);
      deletedCount++;
      console.log(`✅ Deleted eligible temp directory: ${item.name}`);
    } catch (e) {
      console.warn(`⚠️ Failed to delete ${item.name}:`, e.message);
    }
  }

  console.log(`🎉 Cleanup completed. ${deletedCount} eligible temp directory(ies) removed.\n`);
  process.exit(0);
}

runCleanupCli();
