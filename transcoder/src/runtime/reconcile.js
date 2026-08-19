/**
 * transcoder/src/runtime/reconcile.js
 *
 * CLI Command for PF Space Transcoder Data Consistency Reconciliation Audit.
 * Default execution mode: READ-ONLY.
 */

import { reconcileTranscodeState, closeReconcileDb } from '../recovery/reconcile.js';

async function runReconcileCli() {
  console.log(`\n========================================`);
  console.log(`PF SPACE TRANSCODER RECONCILIATION`);
  console.log(`========================================`);

  try {
    const report = await reconcileTranscodeState({ checkQueue: true });

    console.log(`Database Films       : ${report.totalFilms}`);
    console.log(`Healthy HLS          : ${report.healthy}`);
    console.log(`Missing HLS          : ${report.missingHls}`);
    console.log(`Invalid HLS          : ${report.invalidHls}`);
    console.log(`Zombie Processing    : ${report.zombieProcessing}`);
    console.log(`Stale Temp           : ${report.staleTemp}`);
    console.log(`Orphan HLS           : ${report.orphanHlsCount}`);
    console.log(`========================================`);
    console.log(`Total Problems       : ${report.problemsCount}`);

    if (report.details.length > 0) {
      console.log(`\n📋 Problem Summary Details:`);
      report.details
        .filter((d) => d.auditState !== 'HEALTHY' && d.auditState !== 'IDLE' && d.auditState !== 'FAILED_CLEAN')
        .forEach((d) => {
          console.log(` - Film #${d.filmId} [${d.dbStatus}]: ${d.auditState} -> ${d.issue}`);
        });
    }

    console.log(`\nℹ️ Execution Mode: READ-ONLY (No database or filesystem mutations performed).\n`);
  } catch (err) {
    console.error(`❌ Reconciliation failed:`, err.message);
  } finally {
    await closeReconcileDb();
    process.exit(0);
  }
}

runReconcileCli();
