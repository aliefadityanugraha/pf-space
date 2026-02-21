/**
 * scripts/generate-embeddings.js
 * 
 * Script to generate embeddings for all published films.
 * Run this after enabling semantic search to populate embeddings.
 * 
 * Usage: node scripts/generate-embeddings.js
 */

import { embeddingService } from '../src/services/index.js';
import '../src/database/index.js';

async function main() {
  console.log('🚀 Starting embedding generation...\n');

  try {
    const results = await embeddingService.generateMissingEmbeddings();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n📊 Summary:');
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`📝 Total: ${results.length}`);

    if (failed > 0) {
      console.log('\n❌ Failed films:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - Film ID ${r.filmId}: ${r.error}`));
    }

    console.log('\n✅ Embedding generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
