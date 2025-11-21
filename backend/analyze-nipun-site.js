/**
 * Analyze Nipun's Website with Axe-Core
 * Run with: node backend/analyze-nipun-site.js
 */

import axeService from './services/analysis/axe.service.js';
import axeResultsParser from './services/accessibility/axeResultsParser.js';
import logger from './utils/logger.js';

const WEBSITE_URL = 'https://nipunrajk.github.io/';

async function analyzeNipunSite() {
  console.log("\n🔍 Analyzing Nipun's Website with Axe-Core");
  console.log('='.repeat(60));
  console.log(`URL: ${WEBSITE_URL}\n`);

  try {
    // Run comprehensive Axe analysis
    const results = await axeService.analyzePage(WEBSITE_URL);
    const score = axeService.calculateScore(results);
    const formatted = axeResultsParser.formatForFrontend(results);

    // Display summary
    console.log('📊 ANALYSIS SUMMARY');
    console.log('='.repeat(40));
    console.log(`Axe-Core Score: ${score.score}/100`);
    console.log(`Total Violations: ${results.violations.length}`);
    console.log(`Needs Manual Review: ${results.incomplete.length}`);
    console.log(`Passed Checks: ${results.passes.length}`);
    console.log('');

    // Impact breakdown
    console.log('🎯 IMPACT BREAKDOWN');
    console.log('='.repeat(40));
    console.log(`Critical Issues: ${score.criticalIssues}`);
    console.log(`Serious Issues: ${score.seriousIssues}`);
    console.log(`Moderate Issues: ${score.moderateIssues}`);
    console.log(`Minor Issues: ${score.minorIssues}`);
    console.log('');

    // WCAG compliance
    console.log('📋 WCAG COMPLIANCE');
    console.log('='.repeat(40));
    console.log(`Level A violations: ${formatted.wcagLevels.A}`);
    console.log(`Level AA violations: ${formatted.wcagLevels.AA}`);
    console.log(`Level AAA violations: ${formatted.wcagLevels.AAA}`);
    console.log('');

    // Detailed violations
    if (results.violations.length > 0) {
      console.log('🚨 DETAILED VIOLATIONS');
      console.log('='.repeat(40));

      results.violations.forEach((violation, i) => {
        console.log(`${i + 1}. ${violation.help}`);
        console.log(`   Impact: ${violation.impact.toUpperCase()}`);
        console.log(`   Affects: ${violation.nodes.length} element(s)`);
        console.log(
          `   WCAG: ${violation.tags
            .filter((t) => t.includes('wcag'))
            .join(', ')}`
        );
        console.log(`   Help: ${violation.helpUrl}`);

        // Show first affected element
        if (violation.nodes.length > 0) {
          const node = violation.nodes[0];
          console.log(`   Element: ${node.target?.[0] || 'Unknown selector'}`);
          if (node.html) {
            console.log(
              `   HTML: ${node.html.substring(0, 100)}${
                node.html.length > 100 ? '...' : ''
              }`
            );
          }
        }
        console.log('');
      });
    }

    // Items needing manual review
    if (results.incomplete.length > 0) {
      console.log('⚠️  NEEDS MANUAL REVIEW');
      console.log('='.repeat(40));

      results.incomplete.forEach((item, i) => {
        console.log(`${i + 1}. ${item.help}`);
        console.log(`   Impact: ${item.impact.toUpperCase()}`);
        console.log(`   Affects: ${item.nodes.length} element(s)`);
        console.log(
          `   WCAG: ${item.tags.filter((t) => t.includes('wcag')).join(', ')}`
        );
        console.log('');
      });
    }

    // Comparison with Lighthouse
    console.log('📈 COMPARISON WITH YOUR LIGHTHOUSE RESULTS');
    console.log('='.repeat(40));
    console.log('Lighthouse Accessibility Score: 55/100');
    console.log(`Axe-Core Accessibility Score: ${score.score}/100`);
    console.log('');
    console.log('Key Differences:');
    console.log('• Lighthouse: ~40% WCAG coverage, performance-focused');
    console.log('• Axe-Core: ~57% WCAG coverage, accessibility-focused');
    console.log('• Combined: ~75% WCAG coverage (what FastFix provides)');
    console.log('');

    // Recommendations
    console.log('💡 ENHANCED RECOMMENDATIONS');
    console.log('='.repeat(40));
    console.log('Based on Axe-Core analysis, prioritize:');

    const criticalAndSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalAndSerious.length > 0) {
      console.log('\n🔥 HIGH PRIORITY FIXES:');
      criticalAndSerious.forEach((violation, i) => {
        console.log(`${i + 1}. ${violation.help}`);
        console.log(`   → ${violation.description}`);
      });
    }

    const colorContrastIssues = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (colorContrastIssues.length > 0) {
      console.log('\n🎨 COLOR CONTRAST FIXES:');
      colorContrastIssues.forEach((violation) => {
        violation.nodes.forEach((node) => {
          if (node.any && node.any[0] && node.any[0].data) {
            const data = node.any[0].data;
            console.log(`   • Element: ${node.target?.[0]}`);
            console.log(`     Current: ${data.contrastRatio || 'Unknown'}`);
            console.log(
              `     Required: ${data.expectedContrastRatio || '4.5:1'}`
            );
            console.log(`     Colors: ${data.fgColor} on ${data.bgColor}`);
          }
        });
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(
      '✅ Analysis complete! This is what FastFix with Axe-Core provides.'
    );
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run analysis
analyzeNipunSite();
