#!/usr/bin/env node

/**
 * FastFix CLI
 * Run website audits and accessibility checks from the command line.
 */

import { parseArgs } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import analysisOrchestrator from './services/analysis/analysis-orchestrator.service.js';

// Setup __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environmental variables for local and project roots
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const optionDefinitions = {
  url: { type: 'string' },
  'include-ai': { type: 'boolean', default: false },
  'no-include-axe': { type: 'boolean', default: false },
  'no-include-pa11y': { type: 'boolean', default: false },
  'no-include-keyboard': { type: 'boolean', default: false },
  'fail-on-perf': { type: 'string', default: '0' },
  'fail-on-a11y': { type: 'string', default: '0' },
  'fail-on-best-practices': { type: 'string', default: '0' },
  'fail-on-seo': { type: 'string', default: '0' },
  output: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
};

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      options: optionDefinitions,
      allowPositionals: false,
    });
  } catch (error) {
    console.error(`Error parsing arguments: ${error.message}`);
    printHelp();
    process.exit(1);
  }

  const { values } = parsed;

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.url) {
    console.error('Error: The --url parameter is required.\n');
    printHelp();
    process.exit(1);
  }

  const url = values.url;
  const includeAI = !!values['include-ai'];
  const includeAxe = !values['no-include-axe'];
  const includePa11y = !values['no-include-pa11y'];
  const includeKeyboard = !values['no-include-keyboard'];

  const thresholds = {
    perf: parseInt(values['fail-on-perf'] || '0', 10),
    a11y: parseInt(values['fail-on-a11y'] || '0', 10),
    bestPractices: parseInt(values['fail-on-best-practices'] || '0', 10),
    seo: parseInt(values['fail-on-seo'] || '0', 10),
  };

  console.log(`Starting FastFix audit for: ${url}`);
  console.log(`Tools: Axe-Core=${includeAxe}, Pa11y=${includePa11y}, Keyboard=${includeKeyboard}, AI=${includeAI}`);

  try {
    const results = await analysisOrchestrator.analyzeWebsite({
      url,
      includeAI,
      includeAxe,
      includePa11y,
      includeKeyboard,
      onProgress: (progressData) => {
        if (progressData.message) {
          console.log(`[${progressData.progress}%] ${progressData.message}`);
        }
      },
    });

    // Handle reporting
    console.log('\n======================================');
    console.log('         FASTFIX AUDIT RESULTS        ');
    console.log('======================================\n');
    console.log(`Target URL: ${url}`);
    console.log(`Scanned At: ${new Date().toISOString()}\n`);

    const perfScore = Math.round(results.performance?.score ?? 0);
    const a11yScore = Math.round(results.accessibility?.score ?? 0);
    const bpScore = Math.round(results.bestPractices?.score ?? 0);
    const seoScore = Math.round(results.seo?.score ?? 0);

    console.table([
      { Category: 'Performance', Score: perfScore, Threshold: thresholds.perf },
      { Category: 'Accessibility', Score: a11yScore, Threshold: thresholds.a11y },
      { Category: 'Best Practices', Score: bpScore, Threshold: thresholds.bestPractices },
      { Category: 'SEO', Score: seoScore, Threshold: thresholds.seo },
    ]);

    // Save JSON output if requested
    if (values.output) {
      const outputPath = path.resolve(values.output);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8');
      console.log(`Detailed audit report saved to: ${outputPath}`);
    }

    // Evaluate thresholds
    let thresholdFailed = false;
    const failures = [];

    if (perfScore < thresholds.perf) {
      thresholdFailed = true;
      failures.push(`Performance score (${perfScore}) is below threshold (${thresholds.perf})`);
    }
    if (a11yScore < thresholds.a11y) {
      thresholdFailed = true;
      failures.push(`Accessibility score (${a11yScore}) is below threshold (${thresholds.a11y})`);
    }
    if (bpScore < thresholds.bestPractices) {
      thresholdFailed = true;
      failures.push(`Best Practices score (${bpScore}) is below threshold (${thresholds.bestPractices})`);
    }
    if (seoScore < thresholds.seo) {
      thresholdFailed = true;
      failures.push(`SEO score (${seoScore}) is below threshold (${thresholds.seo})`);
    }

    if (thresholdFailed) {
      console.error('\n❌ Audit threshold check failed:');
      failures.forEach((msg) => console.error(`  - ${msg}`));
      process.exit(1);
    }

    console.log('\n✅ Audit completed successfully! All threshold checks passed.');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Analysis execution failed: ${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
FastFix CLI - Website Quality & Accessibility Auditor

Usage:
  node backend/cli.js --url <url> [options]

Required Options:
  --url <url>                      The target web page URL to analyze.

Configurable Options:
  --include-ai                     Enables AI analysis. (default: false)
  --no-include-axe                 Exclude Axe-Core accessibility testing.
  --no-include-pa11y               Exclude Pa11y accessibility testing.
  --no-include-keyboard            Exclude Puppeteer keyboard accessibility checks.
  --output <file_path>             File path to output the complete audit results JSON object.

Scoring Gates / CI Fail thresholds (0-100):
  --fail-on-perf <score>           Exits with error if Performance score is below <score>.
  --fail-on-a11y <score>           Exits with error if Accessibility score is below <score>.
  --fail-on-best-practices <score> Exits with error if Best Practices score is below <score>.
  --fail-on-seo <score>            Exits with error if SEO score is below <score>.

General:
  -h, --help                       Show this help message.
`);
}

// Run if executed directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main();
}

export { main, optionDefinitions };
