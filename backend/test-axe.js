/**
 * Quick Test Script for Axe-Core Integration
 * Run with: node backend/test-axe.js
 */

import axeService from './services/analysis/axe.service.js';
import axeResultsParser from './services/accessibility/axeResultsParser.js';
import resultsMerger from './services/analysis/results-merger.service.js';
import logger from './utils/logger.js';

const TEST_URL = 'https://www.w3.org/WAI/demos/bad/'; // Intentionally inaccessible site

async function testAxeIntegration() {
  console.log('\n🧪 Testing Axe-Core Integration\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic Analysis
    console.log('\n📊 Test 1: Basic Axe Analysis');
    console.log('-'.repeat(50));
    const results = await axeService.analyzePage(TEST_URL);

    console.log(`✅ Analysis completed for: ${results.url}`);
    console.log(`   Violations: ${results.violations.length}`);
    console.log(`   Incomplete: ${results.incomplete.length}`);
    console.log(`   Passes: ${results.passes.length}`);

    // Test 2: Score Calculation
    console.log('\n📈 Test 2: Score Calculation');
    console.log('-'.repeat(50));
    const score = axeService.calculateScore(results);

    console.log(`✅ Score calculated: ${score.score}/100`);
    console.log(`   Critical: ${score.criticalIssues}`);
    console.log(`   Serious: ${score.seriousIssues}`);
    console.log(`   Moderate: ${score.moderateIssues}`);
    console.log(`   Minor: ${score.minorIssues}`);

    // Test 3: Results Parsing
    console.log('\n🔍 Test 3: Results Parsing');
    console.log('-'.repeat(50));
    const formatted = axeResultsParser.formatForFrontend(results);

    console.log(`✅ Results formatted for frontend`);
    console.log(`   Total violations: ${formatted.violations.length}`);
    console.log(`   WCAG Level A: ${formatted.wcagLevels.A}`);
    console.log(`   WCAG Level AA: ${formatted.wcagLevels.AA}`);
    console.log(`   WCAG Level AAA: ${formatted.wcagLevels.AAA}`);

    // Test 4: WCAG Level Analysis
    console.log('\n🎯 Test 4: WCAG Level AA Analysis');
    console.log('-'.repeat(50));
    const aaResults = await axeService.analyzeByWCAGLevel(TEST_URL, 'AA');

    console.log(`✅ WCAG AA analysis completed`);
    console.log(`   Violations: ${aaResults.violations.length}`);

    // Test 5: Violations Only (Fast Mode)
    console.log('\n⚡ Test 5: Violations Only (Fast Mode)');
    console.log('-'.repeat(50));
    const violationsOnly = await axeService.getViolationsOnly(TEST_URL);

    console.log(`✅ Fast analysis completed`);
    console.log(`   Violations: ${violationsOnly.violations.length}`);

    // Test 6: Sample Violation Details
    console.log('\n📋 Test 6: Sample Violation Details');
    console.log('-'.repeat(50));
    if (results.violations.length > 0) {
      const sampleViolation = results.violations[0];
      console.log(`✅ Sample violation:`);
      console.log(`   ID: ${sampleViolation.id}`);
      console.log(`   Impact: ${sampleViolation.impact}`);
      console.log(`   Help: ${sampleViolation.help}`);
      console.log(`   Nodes affected: ${sampleViolation.nodes.length}`);
      console.log(
        `   WCAG Tags: ${sampleViolation.tags
          .filter((t) => t.includes('wcag'))
          .join(', ')}`
      );
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed successfully!');
    console.log('='.repeat(50));
    console.log('\n🎉 Axe-Core integration is working correctly!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testAxeIntegration();
