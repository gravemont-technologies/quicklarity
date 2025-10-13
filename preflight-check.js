#!/usr/bin/env node
// Pre-flight validation - checks all dependencies and configuration before running
require('dotenv').config();

const requiredEnvVars = {
  backend: [
    'CLERK_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
  ],
  optional: [
    'POSTHOG_API_KEY',
    'NOTION_API_KEY',
    'REDIS_URL',
  ]
};

console.log('🔍 Running pre-flight checks...\n');

let errors = 0;
let warnings = 0;

// Check required env vars
console.log('✓ Required Environment Variables:');
for (const varName of requiredEnvVars.backend) {
  if (!process.env[varName]) {
    console.error(`  ❌ Missing: ${varName}`);
    errors++;
  } else {
    console.log(`  ✅ ${varName}: ${process.env[varName].slice(0, 10)}...`);
  }
}

// Check optional env vars
console.log('\n⚠ Optional Environment Variables:');
for (const varName of requiredEnvVars.optional) {
  if (!process.env[varName]) {
    console.warn(`  ⚠️  Missing (optional): ${varName}`);
    warnings++;
  } else {
    console.log(`  ✅ ${varName}: configured`);
  }
}

// Check models configured
console.log('\n🤖 Model Configuration:');
const models = ['FREE_MODEL', 'PAID_MODEL', 'SUMMARIZATION_MODEL', 'FREE_FINAL_MODEL'];
for (const model of models) {
  const value = process.env[model];
  if (value) {
    console.log(`  ✅ ${model}: ${value}`);
  } else {
    console.warn(`  ⚠️  ${model}: using default`);
  }
}

// Check prompt files exist
console.log('\n📝 Prompt Files:');
const fs = require('fs');
const path = require('path');
const promptFiles = [
  'prompts/profile-summarize.txt',
  'prompts/doc-summarize.txt',
  'prompts/plan-generation.txt',
  'prompts/rectifier.txt'
];

for (const file of promptFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ Missing: ${file}`);
    errors++;
  }
}

// Check worker files exist
console.log('\n⚙️ Worker Files:');
const workerFiles = [
  'worker/index.js',
  'worker/pipeline.js',
  'worker/scorer.js',
  'worker/steps/profileNormalizer.js',
  'worker/steps/docSummarizer.js',
  'worker/steps/planGenerator.js',
  'worker/notionPublisher.js',
  'worker/calendarGenerator.js',
  'worker/utils/openaiClient.js'
];

for (const file of workerFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ Missing: ${file}`);
    errors++;
  }
}

// Check node_modules
console.log('\n📦 Dependencies:');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules exists');
} else {
  console.error('  ❌ node_modules missing - run: npm install');
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors > 0) {
  console.error(`\n❌ PRE-FLIGHT FAILED: ${errors} error(s), ${warnings} warning(s)`);
  console.error('\nFix errors above before running the application.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  PRE-FLIGHT PASSED WITH WARNINGS: ${warnings} warning(s)`);
  console.warn('Optional features may not work. Continue anyway.\n');
} else {
  console.log('\n✅ PRE-FLIGHT PASSED - All systems ready!');
  console.log('\nRun: npm run dev (API) and npm run worker:dev (Worker)\n');
}

