#!/usr/bin/env node

/**
 * ESLint wrapper for lint-staged to avoid module conflicts
 * This script handles ESLint execution for individual staged files
 */

import { ESLint } from 'eslint';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No files to lint');
  process.exit(0);
}

try {
  // Create ESLint instance with fix option
  const eslint = new ESLint({ 
    fix: true,
    overrideConfigFile: 'eslint.config.mjs'
  });

  // Lint and fix the files
  const results = await eslint.lintFiles(files);
  
  // Apply fixes
  await ESLint.outputFixes(results);

  // Check for errors
  const hasErrors = results.some(result => result.errorCount > 0);
  
  if (hasErrors) {
    console.error('ESLint found errors:');
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.error(resultText);
    process.exit(1);
  }

  console.log(`✓ Linted ${files.length} file(s) successfully`);
  process.exit(0);

} catch (error) {
  console.error('ESLint error:', error.message);
  process.exit(1);
}