/**
 * src/config/env.js
 * 
 * Validates required environment variables at startup.
 * Prevents the server from running with missing critical configuration.
 */

/**
 * Required environment variables — server will NOT start without these
 */
const REQUIRED_VARS = [
  { key: 'DB_NAME',            description: 'Database name' },
  { key: 'DB_USER',            description: 'Database user' },
  { key: 'BETTER_AUTH_SECRET', description: 'Auth secret key (min 32 chars)' },
  { key: 'BETTER_AUTH_URL',    description: 'Auth base URL (e.g. http://localhost:3000)' },
];

/**
 * Optional but recommended variables — server will start but features may not work
 */
const OPTIONAL_VARS = [
  { key: 'DB_PASSWORD',          description: 'Database password' },
  { key: 'FRONTEND_URL',        description: 'Frontend URL for redirects' },
  { key: 'GOOGLE_CLIENT_ID',    description: 'Google OAuth Client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth Client Secret' },
  { key: 'GEMINI_API_KEY',      description: 'Gemini API Key (for AI Chat & Semantic Search)' },
];

/**
 * Validate all environment variables and exit if critical ones are missing.
 * Should be called before any other initialization.
 */
export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push({ key, description });
    }
  }

  // Check optional variables
  for (const { key, description } of OPTIONAL_VARS) {
    if (!process.env[key] || process.env[key].trim() === '') {
      warnings.push({ key, description });
    }
  }

  // Specific validation: BETTER_AUTH_SECRET length
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret && secret.length < 32) {
    missing.push({ 
      key: 'BETTER_AUTH_SECRET', 
      description: `Must be at least 32 characters (current: ${secret.length})` 
    });
  }

  // Print warnings for optional vars
  if (warnings.length > 0) {
    console.warn('\n⚠️  Missing optional environment variables:');
    console.warn('   Some features may not work properly.\n');
    for (const { key, description } of warnings) {
      console.warn(`   • ${key} — ${description}`);
    }
    console.warn('');
  }

  // Exit if required vars are missing
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    for (const { key, description } of missing) {
      console.error(`   • ${key} — ${description}`);
    }
    console.error('\n   Please check your .env file. See .env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}
