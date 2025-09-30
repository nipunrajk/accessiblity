import { Octokit } from '@octokit/rest';
import { promises as fs } from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const getGitConfig = async () => {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = await fs.readFile(configPath, 'utf8');
    return JSON.parse(config);
  } catch (error) {
    throw new Error(
      'GitHub configuration not found. Please ensure config.json is set up in the backend folder'
    );
  }
};

const formatDiffChanges = (results) => {
  let formatted = '';

  results
    .filter((r) => r.status === 'success' && r.changes && r.changes.length > 0)
    .forEach((result) => {
      formatted += `### 📁 ${result.filePath}\n\n`;

      result.changes.forEach((change, index) => {
        formatted += `<details>\n`;
        formatted += `<summary><strong>✅ ${change.type}</strong> - ${change.description}</summary>\n\n`;
        formatted += `**📍 Line ${change.lineNumber}**\n\n`;
        formatted += `\`\`\`diff\n`;
        formatted += `- ${change.before}\n`;
        formatted += `+ ${change.after}\n`;
        formatted += `\`\`\`\n\n`;
        formatted += `**What changed:** ${change.description}\n\n`;
        formatted += `</details>\n\n`;
      });

      formatted += `---\n\n`;
    });

  return formatted;
};

const formatAISuggestions = (aiSuggestions, specificRecommendations = []) => {
  let formatted = '';

  // First, add specific recommendations from our analysis
  if (specificRecommendations && specificRecommendations.length > 0) {
    // Count issues by priority
    const priorityCounts = specificRecommendations.reduce((acc, rec) => {
      acc[rec.priority || 'Moderate'] =
        (acc[rec.priority || 'Moderate'] || 0) + 1;
      return acc;
    }, {});

    formatted += `## 🎯 Specific Issues Found\n\n`;
    formatted += `**Priority Summary:**\n`;
    if (priorityCounts.Critical)
      formatted += `- 🚨 **${priorityCounts.Critical} Critical** (WCAG Level A - Must Fix)\n`;
    if (priorityCounts.Serious)
      formatted += `- ⚠️ **${priorityCounts.Serious} Serious** (WCAG Level AA - Should Fix)\n`;
    if (priorityCounts.Moderate)
      formatted += `- 📋 **${priorityCounts.Moderate} Moderate** (Best Practice - Nice to Fix)\n`;
    formatted += `\n`;

    // Sort recommendations by priority
    const sortedRecommendations = specificRecommendations.sort((a, b) => {
      const priorityOrder = { Critical: 1, Serious: 2, Moderate: 3 };
      return (
        (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
      );
    });

    sortedRecommendations.forEach((rec, index) => {
      // Priority badge with emoji
      const priorityBadge =
        rec.priority === 'Critical'
          ? '🚨 **CRITICAL**'
          : rec.priority === 'Serious'
          ? '⚠️ **SERIOUS**'
          : '📋 **MODERATE**';

      const wcagBadge = rec.wcagLevel ? `**WCAG Level ${rec.wcagLevel}**` : '';
      const criterionBadge = rec.wcagCriterion
        ? `**${rec.wcagCriterion}**`
        : '';

      formatted += `### ${index + 1}. ${rec.title}\n\n`;
      formatted += `${priorityBadge} ${wcagBadge} ${criterionBadge}\n\n`;
      formatted += `**📍 Location:** \`${rec.location}\`\n\n`;
      formatted += `**🔍 Issue:** ${rec.description}\n\n`;

      if (rec.userImpact) {
        formatted += `**👥 User Impact:** ${rec.userImpact}\n\n`;
      }

      if (rec.legalRisk) {
        formatted += `**⚖️ Legal Risk:** ${rec.legalRisk}\n\n`;
      }

      formatted += `**📝 Current Code:**\n\`\`\`html\n${rec.currentCode}\n\`\`\`\n\n`;
      formatted += `**✅ Suggested Fix:**\n\`\`\`html\n${rec.suggestedFix}\n\`\`\`\n\n`;
      formatted += `**💡 Impact:** ${rec.impact}\n\n`;
      formatted += `**📚 Reference:** ${rec.wcagReference}\n\n`;
      formatted += `---\n\n`;
    });
  }

  // Then add general AI suggestions if available
  if (aiSuggestions && typeof aiSuggestions === 'object') {
    formatted += `## 🤖 Additional AI Recommendations\n\n`;

    Object.entries(aiSuggestions).forEach(([key, suggestions]) => {
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        // Group suggestions by main categories
        const categories = {};

        suggestions.forEach((suggestion) => {
          if (suggestion.description) {
            // Extract main category from description
            let category = 'General Improvements';
            if (
              suggestion.description.includes('Alt Attributes') ||
              suggestion.description.includes('alt')
            ) {
              category = '🖼️ Image Accessibility';
            } else if (suggestion.description.includes('Color Contrast')) {
              category = '🎨 Color & Contrast';
            } else if (suggestion.description.includes('Keyboard Navigation')) {
              category = '⌨️ Keyboard Navigation';
            } else if (suggestion.description.includes('Focus')) {
              category = '🎯 Focus Management';
            } else if (
              suggestion.description.includes('ARIA') ||
              suggestion.description.includes('aria')
            ) {
              category = '🏷️ ARIA Labels';
            }

            if (!categories[category]) {
              categories[category] = [];
            }
            categories[category].push(suggestion);
          }
        });

        // Format each category
        Object.entries(categories).forEach(
          ([category, categorySuggestions]) => {
            formatted += `### ${category}\n\n`;

            categorySuggestions.forEach((suggestion) => {
              formatted += `**${suggestion.description}**\n`;

              if (suggestion.implementation) {
                formatted += `- Implementation: ${suggestion.implementation}\n`;
              }

              if (suggestion.codeExample && suggestion.codeExample.trim()) {
                formatted += `- Code Example:\n\`\`\`html\n${suggestion.codeExample}\n\`\`\`\n`;
              }

              if (
                suggestion.expectedImpact &&
                suggestion.expectedImpact.trim()
              ) {
                formatted += `- Expected Impact: ${suggestion.expectedImpact}\n`;
              }

              formatted += '\n';
            });

            formatted += '\n';
          }
        );
      }
    });
  }

  return (
    formatted ||
    'Consider reviewing accessibility best practices for additional improvements.'
  );
};

const applyFixToHTML = (htmlContent, issue) => {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  let modified = false;
  const changes = [];

  switch (issue.type) {
    case 'accessibility':
      if (issue.message.includes('Image missing alt attribute')) {
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach((img) => {
          const beforeHTML = img.outerHTML;
          img.setAttribute('alt', 'Descriptive text for the image');
          const afterHTML = img.outerHTML;

          changes.push({
            type: 'Image Alt Attribute',
            description:
              'Added alt attribute to image for screen reader accessibility',
            before: beforeHTML,
            after: afterHTML,
            lineNumber: issue.line || 'Unknown',
          });
          modified = true;
        });
      } else if (
        issue.message.includes('HTML element missing lang attribute')
      ) {
        const html = document.querySelector('html');
        if (html && !html.getAttribute('lang')) {
          const beforeHTML = html.outerHTML.split('>')[0] + '>';
          html.setAttribute('lang', 'en');
          const afterHTML = html.outerHTML.split('>')[0] + '>';

          changes.push({
            type: 'HTML Language Attribute',
            description:
              'Added lang attribute to HTML element for proper language identification',
            before: beforeHTML,
            after: afterHTML,
            lineNumber: issue.line || 'Unknown',
          });
          modified = true;
        }
      } else if (issue.message.includes('Page missing H1 heading')) {
        const body = document.querySelector('body');
        const existingH1 = document.querySelector('h1');
        if (body && !existingH1) {
          const h1 = document.createElement('h1');
          h1.textContent = 'Main Page Title';
          body.insertBefore(h1, body.firstChild);
          modified = true;
        }
      } else if (
        issue.message.includes('Form input missing associated label')
      ) {
        const inputs = document.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="password"], textarea'
        );
        inputs.forEach((input, index) => {
          const id = input.getAttribute('id') || `input-${index}`;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');

          if (!ariaLabel && !ariaLabelledBy) {
            const existingLabel = document.querySelector(`label[for="${id}"]`);
            if (!existingLabel) {
              input.setAttribute('id', id);
              const label = document.createElement('label');
              label.setAttribute('for', id);
              label.textContent = 'Label text';
              input.parentNode.insertBefore(label, input);
              modified = true;
            }
          }
        });
      } else if (issue.message.includes('Heading level skipped')) {
        // Extract the correct heading level from the fix suggestion
        const match = issue.fix.match(/Use H(\d+) instead/);
        if (match) {
          const correctLevel = match[1];
          const currentLevel = issue.element.charAt(1);
          const headings = document.querySelectorAll(`h${currentLevel}`);
          headings.forEach((heading) => {
            const beforeHTML = heading.outerHTML;
            const newHeading = document.createElement(`h${correctLevel}`);
            newHeading.innerHTML = heading.innerHTML;
            // Copy attributes
            Array.from(heading.attributes).forEach((attr) => {
              newHeading.setAttribute(attr.name, attr.value);
            });
            heading.parentNode.replaceChild(newHeading, heading);
            const afterHTML = newHeading.outerHTML;

            changes.push({
              type: 'Heading Hierarchy Fix',
              description: `Fixed skipped heading level from H${currentLevel} to H${correctLevel}`,
              before: beforeHTML,
              after: afterHTML,
              lineNumber: issue.line || 'Unknown',
            });
            modified = true;
          });
        }
      } else if (issue.message.includes('Table header row uses')) {
        const tables = document.querySelectorAll('table');
        tables.forEach((table) => {
          const firstRow = table.querySelector('tr');
          if (firstRow) {
            const beforeHTML = firstRow.outerHTML;
            const tdElements = firstRow.querySelectorAll('td');
            tdElements.forEach((td) => {
              const th = document.createElement('th');
              th.innerHTML = td.innerHTML;
              // Copy attributes
              Array.from(td.attributes).forEach((attr) => {
                th.setAttribute(attr.name, attr.value);
              });
              td.parentNode.replaceChild(th, td);
              modified = true;
            });
            const afterHTML = firstRow.outerHTML;

            changes.push({
              type: 'Table Header Fix',
              description:
                'Changed table data cells to proper header cells in first row',
              before: beforeHTML,
              after: afterHTML,
              lineNumber: issue.line || 'Unknown',
            });
          }
        });
      } else if (
        issue.message.includes('Custom button component missing ARIA')
      ) {
        const customButtons = document.querySelectorAll(
          'div[class*="button"], span[class*="button"], div[onclick], span[onclick]'
        );
        customButtons.forEach((button) => {
          const beforeHTML = button.outerHTML;
          let buttonModified = false;

          if (!button.getAttribute('role')) {
            button.setAttribute('role', 'button');
            buttonModified = true;
            modified = true;
          }
          if (!button.getAttribute('tabindex')) {
            button.setAttribute('tabindex', '0');
            buttonModified = true;
            modified = true;
          }

          if (buttonModified) {
            const afterHTML = button.outerHTML;
            changes.push({
              type: 'Custom Button ARIA',
              description:
                'Added role="button" and tabindex="0" for keyboard accessibility',
              before: beforeHTML,
              after: afterHTML,
              lineNumber: issue.line || 'Unknown',
            });
          }
        });
      } else if (
        issue.message.includes('Viewport meta tag prevents user scaling')
      ) {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          const beforeHTML = viewportMeta.outerHTML;
          viewportMeta.setAttribute(
            'content',
            'width=device-width, initial-scale=1'
          );
          const afterHTML = viewportMeta.outerHTML;

          changes.push({
            type: 'Viewport Scaling',
            description:
              'Removed user-scalable=no to allow users to zoom content',
            before: beforeHTML,
            after: afterHTML,
            lineNumber: issue.line || 'Unknown',
          });
          modified = true;
        }
      } else if (issue.message.includes('Ambiguous link text')) {
        // Note: Ambiguous link text requires manual review as it needs context-specific descriptive text
        // This is flagged but not automatically fixed
      }
      break;

    case 'seo':
      if (issue.message.includes('Missing meta description')) {
        const head = document.querySelector('head');
        const existingMeta = document.querySelector('meta[name="description"]');
        if (head && !existingMeta) {
          const beforeHTML = '<head>';
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'description');
          meta.setAttribute('content', 'Add your website description here');
          head.appendChild(meta);
          const afterHTML =
            '<head>\n  <meta name="description" content="Add your website description here">';

          changes.push({
            type: 'Meta Description',
            description:
              'Added meta description tag for SEO and social sharing',
            before: beforeHTML,
            after: afterHTML,
            lineNumber: issue.line || 'Unknown',
          });
          modified = true;
        }
      } else if (issue.message.includes('Missing or empty title tag')) {
        const head = document.querySelector('head');
        let title = document.querySelector('title');
        if (head) {
          const beforeHTML = title ? title.outerHTML : '<head>';
          if (!title) {
            title = document.createElement('title');
            head.appendChild(title);
          }
          if (!title.textContent.trim()) {
            title.textContent = 'Your Page Title';
            const afterHTML = title.outerHTML;

            changes.push({
              type: 'Page Title',
              description: 'Added page title for SEO and browser tabs',
              before: beforeHTML,
              after: afterHTML,
              lineNumber: issue.line || 'Unknown',
            });
            modified = true;
          }
        }
      }
      break;
  }

  return {
    content: modified ? dom.serialize() : htmlContent,
    modified,
    changes,
  };
};

export const applyAccessibilityFixes = async (req, res) => {
  try {
    const { issues, aiSuggestions } = req.body;

    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({
        error: 'Required field missing: issues array',
      });
    }

    const config = await getGitConfig();
    const { githubToken, owner, repo } = config;

    const octokit = new Octokit({
      auth: githubToken,
    });

    // Create a new branch
    const branchName = `accessibility-fixes-${Date.now()}`;
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    // Group issues by file
    const issuesByFile = issues.reduce((acc, issue) => {
      const filePath = issue.file || 'index.html';
      if (!acc[filePath]) {
        acc[filePath] = [];
      }
      acc[filePath].push(issue);
      return acc;
    }, {});

    const results = [];
    const changes = [];
    const allSpecificRecommendations = [];

    // Collect specific recommendations from issues
    issues.forEach((issue) => {
      if (issue.specificRecommendation) {
        allSpecificRecommendations.push(issue.specificRecommendation);
      }
    });

    // Process each file
    for (const [filePath, fileIssues] of Object.entries(issuesByFile)) {
      try {
        // Get the file content
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
        });

        let htmlContent = Buffer.from(fileData.content, 'base64').toString();
        let fileModified = false;
        const appliedFixes = [];
        const allFileChanges = [];

        // Apply each fix to the file
        for (const issue of fileIssues) {
          const result = applyFixToHTML(htmlContent, issue);
          if (result.modified) {
            htmlContent = result.content;
            fileModified = true;
            appliedFixes.push({
              issue: issue.message,
              type: issue.type,
              severity: issue.severity,
            });
            // Collect all changes for diff display
            allFileChanges.push(...(result.changes || []));
          }
        }

        if (fileModified) {
          // Commit the changes
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Fix accessibility issues in ${filePath}`,
            content: Buffer.from(htmlContent).toString('base64'),
            branch: branchName,
            sha: fileData.sha,
          });

          results.push({
            filePath,
            status: 'success',
            fixesApplied: appliedFixes.length,
            fixes: appliedFixes,
            changes: allFileChanges,
          });

          changes.push({
            file: filePath,
            category: 'accessibility',
            impact: 'high',
            reason: `Applied ${appliedFixes.length} accessibility fixes`,
            originalCode: 'Multiple issues fixed',
            newCode: 'Accessibility improvements applied',
          });
        } else {
          results.push({
            filePath,
            status: 'no_changes',
            message: 'No applicable fixes found',
          });
        }
      } catch (error) {
        results.push({
          filePath,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Count critical issues for PR title
    const criticalIssues = allSpecificRecommendations.filter(
      (rec) => rec.priority === 'Critical'
    ).length;
    const totalIssues = allSpecificRecommendations.length;

    // Create pull request
    const { data: pullRequest } = await octokit.pulls.create({
      owner,
      repo,
      title:
        criticalIssues > 0
          ? `🚨 Critical Accessibility Fixes (${criticalIssues} critical, ${totalIssues} total)`
          : `♿ Accessibility Improvements (${totalIssues} issues fixed)`,
      body: `## 🚀 Automated Accessibility Fixes Applied

${results
  .filter((r) => r.status === 'success')
  .map(
    (r) =>
      `### 📁 ${r.filePath}
**${r.fixesApplied} fixes applied:**
${r.fixes.map((f) => `- ✅ ${f.issue}`).join('\n')}`
  )
  .join('\n\n')}

---

## 🔧 Detailed Changes Made

${formatDiffChanges(results)}

---

## 🤖 AI Recommendations for Further Improvements

${
  aiSuggestions || allSpecificRecommendations.length > 0
    ? formatAISuggestions(aiSuggestions, allSpecificRecommendations)
    : 'Additional AI suggestions were not provided, but consider reviewing the following areas:\n- Color contrast ratios\n- Keyboard navigation\n- Screen reader compatibility\n- Focus management'
}

---

## 📋 Next Steps

1. **Review the changes** in this pull request
2. **Test the accessibility improvements** using screen readers or accessibility tools
3. **Consider implementing the AI recommendations** above for comprehensive accessibility
4. **Run accessibility audits** to verify improvements

---

*This pull request was automatically generated by FastFix. For questions or issues, please review the [accessibility guidelines](https://www.w3.org/WAI/WCAG21/quickref/).*`,
      head: branchName,
      base: 'main',
    });

    res.json({
      success: true,
      results,
      changes,
      pullRequest: {
        html_url: pullRequest.html_url,
        diff_url: pullRequest.diff_url,
        number: pullRequest.number,
        title: pullRequest.title,
      },
      summary: {
        filesModified: results.filter((r) => r.status === 'success').length,
        totalFixes: results.reduce((sum, r) => sum + (r.fixesApplied || 0), 0),
      },
    });
  } catch (error) {
    console.error('Error applying accessibility fixes:', error);
    res.status(500).json({
      error: `Failed to apply fixes: ${error.message}`,
    });
  }
};
