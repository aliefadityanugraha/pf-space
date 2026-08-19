/**
 * transcoder/src/runtime/cli.js
 *
 * CLI Runner for cross-platform Transcoder Runtime Health Check.
 * Usage: node src/runtime/cli.js
 */

import { checkRuntime } from './checkRuntime.js';

async function main() {
  console.log('\n🔍 Running PF Space Transcoder Runtime Health Check...\n');
  const report = await checkRuntime();

  console.log(`[Status]       : ${report.status === 'READY' ? '🟢 READY' : '🔴 NOT_READY'}`);
  console.log(`[Timestamp]    : ${report.timestamp}`);
  console.log(`[OS / Node]    : ${report.system.platform} (${report.system.arch}) | Node ${report.system.nodeVersion}`);
  console.log(`[CPU / Memory] : ${report.system.cpuCount} Cores | Free RAM: ${(report.system.freeMemBytes / (1024 * 1024 * 1024)).toFixed(2)} GB / ${(report.system.totalMemBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`[Concurrency]  : ${report.concurrency} worker job(s)`);
  console.log('----------------------------------------------------');
  console.log(`[Redis]        : ${report.redis.ready ? '✅ Connected' : '❌ ' + (report.redis.error || 'Unavailable')}`);
  console.log(`[FFmpeg]       : ${report.ffmpeg.ready ? '✅ ' + report.ffmpeg.version : '❌ ' + (report.ffmpeg.error || 'Unavailable')}`);
  console.log(`[FFprobe]      : ${report.ffprobe.ready ? '✅ ' + report.ffprobe.version : '❌ ' + (report.ffprobe.error || 'Unavailable')}`);
  console.log(`[Upload Dir]   : ${report.filesystem.uploadDirReadable ? '✅ Readable' : '❌ Not Readable'} (${report.filesystem.uploadDir})`);
  console.log(`[HLS Out Dir]  : ${report.filesystem.hlsOutputDirWritable ? '✅ Writable' : '❌ Not Writable'} (${report.filesystem.hlsOutputDir})`);
  console.log('----------------------------------------------------');

  if (report.blockers.length > 0) {
    console.log('\n⚠️  Active Blockers preventing transcoding execution:');
    report.blockers.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
    console.log('\nPlease resolve the blockers above before running Sprint 2 real transcoding.\n');
  } else {
    console.log('\n🎉 Transcoder runtime environment is fully READY!\n');
  }
}

main().catch((err) => {
  console.error('Runtime CLI error:', err);
  process.exit(1);
});
