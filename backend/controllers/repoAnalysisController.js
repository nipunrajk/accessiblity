import { Octokit } from '@octokit/rest';
import { promises as fs } from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import logger from '../utils/logger.js';

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

// Prioritization system based on WCAG levels and user impact
const getPriorityInfo = (issueType, wcagCriterion) => {
  const priorityMap = {
    // Critical - WCAG Level A (Fundamental accessibility)
    '1.1.1': { priority: 'Critical', level: 'A', order: 1, legalRisk: 'High' }, // Non-text Content
    '1.3.1': { priority: 'Critical', level: 'A', order: 2, legalRisk: 'High' }, // Info and Relationships
    '2.1.1': { priority: 'Critical', level: 'A', order: 3, legalRisk: 'High' }, // Keyboard
    '2.4.4': { priority: 'Critical', level: 'A', order: 4, legalRisk: 'High' }, // Link Purpose
    '4.1.2': { priority: 'Critical', level: 'A', order: 5, legalRisk: 'High' }, // Name, Role, Value

    // Serious - WCAG Level AA (Standard compliance)
    '1.4.3': {
      priority: 'Serious',
      level: 'AA',
      order: 6,
      legalRisk: 'Medium',
    }, // Contrast (Minimum)
    '1.4.4': {
      priority: 'Serious',
      level: 'AA',
      order: 7,
      legalRisk: 'Medium',
    }, // Resize Text
    '2.4.7': {
      priority: 'Serious',
      level: 'AA',
      order: 8,
      legalRisk: 'Medium',
    }, // Focus Visible
    '3.1.1': {
      priority: 'Serious',
      level: 'AA',
      order: 9,
      legalRisk: 'Medium',
    }, // Language of Page

    // Moderate - WCAG Level AAA or best practices
    seo: {
      priority: 'Moderate',
      level: 'Best Practice',
      order: 10,
      legalRisk: 'Low',
    },
    performance: {
      priority: 'Moderate',
      level: 'Best Practice',
      order: 11,
      legalRisk: 'Low',
    },
  };

  return (
    priorityMap[wcagCriterion] || {
      priority: 'Moderate',
      level: 'Best Practice',
      order: 12,
      legalRisk: 'Low',
    }
  );
};

// User impact statistics for context
const getUserImpactStats = (issueType) => {
  const impactMap = {
    'alt-missing': 'Affects 285 million visually impaired users worldwide',
    'lang-missing': 'Affects users of screen readers and translation tools',
    'heading-structure':
      'Affects 285 million visually impaired users navigating by headings',
    'form-labels':
      'Affects users with cognitive disabilities and screen reader users',
    'link-ambiguous': 'Affects screen reader users navigating by links',
    'table-headers': 'Affects users trying to understand data relationships',
    'custom-button': 'Affects keyboard users and screen reader users',
    'viewport-scaling': 'Affects 2.2 billion people with vision impairment',
    'meta-description': 'Affects SEO and social media sharing',
    'title-missing': 'Affects SEO and browser navigation',
  };

  return impactMap[issueType] || 'Affects users with disabilities';
};

const analyzeHTMLContent = (htmlContent, filePath) => {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  const issues = [];
  const lines = htmlContent.split('\n');

  // Helper function to find line number of an element
  const findLineNumber = (element) => {
    const elementHTML = element.outerHTML;
    const elementStart = elementHTML.split('>')[0] + '>';

    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].includes(elementStart) ||
        lines[i].includes(element.tagName.toLowerCase())
      ) {
        return i + 1;
      }
    }
    return 1; // fallback
  };

  // Helper function to get element context (surrounding lines)
  const getElementContext = (lineNumber, contextLines = 2) => {
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    return {
      before: lines.slice(start, lineNumber - 1),
      current: lines[lineNumber - 1] || '',
      after: lines.slice(lineNumber, end),
      lineNumber,
    };
  };

  // Check for missing alt attributes on images
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.getAttribute('alt')) {
      const lineNumber = findLineNumber(img);
      const context = getElementContext(lineNumber);
      const src = img.getAttribute('src') || 'unknown';

      const priorityInfo = getPriorityInfo('accessibility', '1.1.1');

      issues.push({
        type: 'accessibility',
        severity: priorityInfo.priority.toLowerCase(),
        priority: priorityInfo.order,
        wcagLevel: priorityInfo.level,
        wcagCriterion: '1.1.1',
        message: 'Image missing alt attribute',
        element: 'img',
        file: filePath,
        line: lineNumber,
        fix: `Add alt attribute: alt="Descriptive text for the image"`,
        code: img.outerHTML,
        context: context,
        specificRecommendation: {
          title: 'Missing Alt Attribute on Image',
          priority: priorityInfo.priority,
          wcagLevel: priorityInfo.level,
          wcagCriterion: '1.1.1',
          description: `Image at line ${lineNumber} is missing an alt attribute, making it inaccessible to screen readers.`,
          element: `<img src="${src}">`,
          location: `${filePath}:${lineNumber}`,
          currentCode: context.current.trim(),
          suggestedFix: context.current.replace(
            '<img',
            '<img alt="Descriptive text for the image"'
          ),
          impact:
            'Screen readers cannot describe this image to visually impaired users',
          userImpact: getUserImpactStats('alt-missing'),
          wcagReference: 'WCAG 2.1 - 1.1.1 Non-text Content',
          legalRisk:
            priorityInfo.legalRisk +
            ' - Required by ADA, Section 508, and WCAG Level A',
        },
      });
    }
  });

  // Check for missing meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    const head = document.querySelector('head');
    const headLineNumber = head ? findLineNumber(head) : 1;
    const context = getElementContext(headLineNumber);

    issues.push({
      type: 'seo',
      severity: 'medium',
      message: 'Missing meta description',
      element: 'meta',
      file: filePath,
      line: headLineNumber,
      fix: `Add meta description: <meta name="description" content="Your page description">`,
      code: '<head>',
      context: context,
      specificRecommendation: {
        title: 'Missing Meta Description',
        description: `Page is missing a meta description tag, which is crucial for SEO and social media sharing.`,
        element: '<head>',
        location: `${filePath}:${headLineNumber}`,
        currentCode: context.current.trim(),
        suggestedFix: `${context.current}\n  <meta name="description" content="Add your website description here">`,
        impact:
          'Search engines and social media platforms cannot display a proper description of your page',
        wcagReference: 'SEO Best Practice - Meta Description',
      },
    });
  }

  // Check for missing title tag
  const title = document.querySelector('title');
  if (!title || !title.textContent.trim()) {
    const head = document.querySelector('head');
    const headLineNumber = head ? findLineNumber(head) : 1;
    const context = getElementContext(headLineNumber);

    issues.push({
      type: 'seo',
      severity: 'high',
      message: 'Missing or empty title tag',
      element: 'title',
      file: filePath,
      line: headLineNumber,
      fix: `Add title tag: <title>Your Page Title</title>`,
      code: '<head>',
      context: context,
      specificRecommendation: {
        title: 'Missing or Empty Title Tag',
        description: `Page ${
          title ? 'has an empty title tag' : 'is missing a title tag'
        }, which is critical for SEO and browser tabs.`,
        element: title ? title.outerHTML : '<head>',
        location: `${filePath}:${headLineNumber}`,
        currentCode: context.current.trim(),
        suggestedFix: title
          ? context.current.replace(
              '<title></title>',
              '<title>Your Page Title</title>'
            )
          : `${context.current}\n  <title>Your Page Title</title>`,
        impact:
          'Search engines cannot properly index your page, and browser tabs will show the URL instead of a meaningful title',
        wcagReference: 'SEO Best Practice - Page Title',
      },
    });
  }

  // Check for missing lang attribute on html tag
  const html = document.querySelector('html');
  if (!html.getAttribute('lang')) {
    const htmlLineNumber = findLineNumber(html);
    const context = getElementContext(htmlLineNumber);

    issues.push({
      type: 'accessibility',
      severity: 'medium',
      message: 'HTML element missing lang attribute',
      element: 'html',
      file: filePath,
      line: htmlLineNumber,
      fix: `Add lang attribute: <html lang="en">`,
      code: html.outerHTML.split('>')[0] + '>',
      context: context,
      specificRecommendation: {
        title: 'Missing Language Attribute on HTML Element',
        description: `HTML element at line ${htmlLineNumber} is missing the lang attribute, which helps screen readers pronounce content correctly.`,
        element: html.outerHTML.split('>')[0] + '>',
        location: `${filePath}:${htmlLineNumber}`,
        currentCode: context.current.trim(),
        suggestedFix: context.current.replace('<html', '<html lang="en"'),
        impact:
          'Screen readers may not pronounce content correctly, affecting accessibility for users with visual impairments',
        wcagReference: 'WCAG 2.1 - 3.1.1 Language of Page',
      },
    });
  }

  // Check for missing form labels
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], textarea'
  );
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'accessibility',
          severity: 'high',
          message: 'Form input missing associated label',
          element: 'input',
          file: filePath,
          line: index + 1,
          fix: `Add label: <label for="${id}">Label text</label> or add aria-label attribute`,
          code: input.outerHTML,
        });
      }
    }
  });

  // Check for heading structure and order
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const h1Count = document.querySelectorAll('h1').length;

  if (h1Count === 0) {
    const body = document.querySelector('body');
    const bodyLineNumber = body ? findLineNumber(body) : 1;
    const context = getElementContext(bodyLineNumber);

    issues.push({
      type: 'accessibility',
      severity: 'medium',
      message: 'Page missing H1 heading',
      element: 'h1',
      file: filePath,
      line: bodyLineNumber,
      fix: `Add H1 heading: <h1>Main Page Title</h1>`,
      code: '<body>',
      context: context,
      specificRecommendation: {
        title: 'Missing H1 Heading',
        description: `Page is missing an H1 heading, which is essential for screen reader navigation and SEO.`,
        element: '<body>',
        location: `${filePath}:${bodyLineNumber}`,
        currentCode: context.current.trim(),
        suggestedFix: `${context.current}\n  <h1>Main Page Title</h1>`,
        impact:
          'Screen readers and SEO tools cannot identify the main topic of the page',
        wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships',
      },
    });
  } else if (h1Count > 1) {
    const firstH1 = document.querySelector('h1');
    const h1LineNumber = findLineNumber(firstH1);
    const context = getElementContext(h1LineNumber);

    issues.push({
      type: 'accessibility',
      severity: 'medium',
      message: 'Multiple H1 headings found (should have only one)',
      element: 'h1',
      file: filePath,
      line: h1LineNumber,
      fix: `Use only one H1 per page, use H2-H6 for subheadings`,
      code: firstH1.outerHTML,
      context: context,
      specificRecommendation: {
        title: 'Multiple H1 Headings Found',
        description: `Found ${h1Count} H1 headings. Pages should have only one H1 for proper document structure.`,
        element: firstH1.outerHTML,
        location: `${filePath}:${h1LineNumber}`,
        currentCode: context.current.trim(),
        suggestedFix:
          'Change additional H1 elements to H2, H3, etc. based on content hierarchy',
        impact: 'Confuses screen readers and affects SEO ranking',
        wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships',
      },
    });
  }

  // Check for proper heading order (no skipped levels)
  if (headings.length > 1) {
    const headingLevels = Array.from(headings).map((h) =>
      parseInt(h.tagName.charAt(1))
    );
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];

      if (currentLevel > previousLevel + 1) {
        const problematicHeading = headings[i];
        const lineNumber = findLineNumber(problematicHeading);
        const context = getElementContext(lineNumber);

        issues.push({
          type: 'accessibility',
          severity: 'medium',
          message: `Heading level skipped: H${previousLevel} to H${currentLevel}`,
          element: `h${currentLevel}`,
          file: filePath,
          line: lineNumber,
          fix: `Use H${
            previousLevel + 1
          } instead of H${currentLevel} to maintain proper hierarchy`,
          code: problematicHeading.outerHTML,
          context: context,
          specificRecommendation: {
            title: 'Skipped Heading Level',
            description: `Heading levels should not be skipped. Found H${currentLevel} after H${previousLevel} at line ${lineNumber}.`,
            element: problematicHeading.outerHTML,
            location: `${filePath}:${lineNumber}`,
            currentCode: context.current.trim(),
            suggestedFix: context.current
              .replace(`<h${currentLevel}`, `<h${previousLevel + 1}`)
              .replace(`</h${currentLevel}>`, `</h${previousLevel + 1}>`),
            impact:
              'Screen readers rely on heading hierarchy for navigation. Skipped levels confuse users',
            wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships',
          },
        });
      }
    }
  }

  // Check for ambiguous link text
  const links = document.querySelectorAll('a[href]');
  const ambiguousTexts = [
    'click here',
    'read more',
    'more',
    'here',
    'link',
    'this',
  ];

  links.forEach((link) => {
    const linkText = link.textContent.trim().toLowerCase();
    if (ambiguousTexts.includes(linkText)) {
      const lineNumber = findLineNumber(link);
      const context = getElementContext(lineNumber);
      const href = link.getAttribute('href');

      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: `Ambiguous link text: "${linkText}"`,
        element: 'a',
        file: filePath,
        line: lineNumber,
        fix: `Use descriptive link text that makes sense out of context`,
        code: link.outerHTML,
        context: context,
        specificRecommendation: {
          title: 'Ambiguous Link Text',
          description: `Link at line ${lineNumber} uses ambiguous text "${linkText}" that doesn't describe the destination.`,
          element: link.outerHTML,
          location: `${filePath}:${lineNumber}`,
          currentCode: context.current.trim(),
          suggestedFix: context.current.replace(
            linkText,
            'descriptive link text'
          ),
          impact:
            'Screen reader users cannot understand link purpose when navigating by links',
          wcagReference: 'WCAG 2.1 - 2.4.4 Link Purpose (In Context)',
        },
      });
    }
  });

  // Check for table headers using td instead of th
  const tables = document.querySelectorAll('table');
  tables.forEach((table) => {
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      const firstRowCells = firstRow.querySelectorAll('td');
      if (firstRowCells.length > 0) {
        const lineNumber = findLineNumber(firstRow);
        const context = getElementContext(lineNumber);

        issues.push({
          type: 'accessibility',
          severity: 'medium',
          message: 'Table header row uses <td> instead of <th>',
          element: 'table',
          file: filePath,
          line: lineNumber,
          fix: `Change <td> elements in header row to <th>`,
          code: firstRow.outerHTML,
          context: context,
          specificRecommendation: {
            title: 'Incorrect Table Header Elements',
            description: `Table at line ${lineNumber} uses <td> elements in the header row instead of <th> elements.`,
            element: firstRow.outerHTML,
            location: `${filePath}:${lineNumber}`,
            currentCode: context.current.trim(),
            suggestedFix: context.current
              .replace(/<td>/g, '<th>')
              .replace(/<\/td>/g, '</th>'),
            impact:
              'Screen readers cannot properly identify table headers, making data relationships unclear',
            wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships',
          },
        });
      }
    }
  });

  // Check for custom components that need ARIA roles
  const fakeButtons = document.querySelectorAll(
    'div[class*="button"], span[class*="button"], div[onclick], span[onclick]'
  );
  fakeButtons.forEach((element) => {
    if (!element.getAttribute('role') && !element.getAttribute('tabindex')) {
      const lineNumber = findLineNumber(element);
      const context = getElementContext(lineNumber);
      const className = element.getAttribute('class') || '';

      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: 'Custom button component missing ARIA role and tabindex',
        element: element.tagName.toLowerCase(),
        file: filePath,
        line: lineNumber,
        fix: `Add role="button" and tabindex="0" to make it keyboard accessible`,
        code: element.outerHTML,
        context: context,
        specificRecommendation: {
          title: 'Custom Button Missing ARIA Role',
          description: `Element at line ${lineNumber} appears to be a custom button but lacks proper ARIA attributes.`,
          element: element.outerHTML,
          location: `${filePath}:${lineNumber}`,
          currentCode: context.current.trim(),
          suggestedFix: context.current.replace(
            element.outerHTML,
            element.outerHTML.replace('>', ' role="button" tabindex="0">')
          ),
          impact:
            "Keyboard users cannot interact with this element, and screen readers don't identify it as a button",
          wcagReference: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
        },
      });
    }
  });

  // Check for viewport zoom restrictions
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    const content = viewportMeta.getAttribute('content') || '';
    if (
      content.includes('user-scalable=no') ||
      content.includes('maximum-scale=1')
    ) {
      const lineNumber = findLineNumber(viewportMeta);
      const context = getElementContext(lineNumber);

      const priorityInfo = getPriorityInfo('accessibility', '1.4.4');

      issues.push({
        type: 'accessibility',
        severity: priorityInfo.priority.toLowerCase(),
        priority: priorityInfo.order,
        wcagLevel: priorityInfo.level,
        wcagCriterion: '1.4.4',
        message: 'Viewport meta tag prevents user scaling',
        element: 'meta',
        file: filePath,
        line: lineNumber,
        fix: `Remove user-scalable=no and maximum-scale restrictions`,
        code: viewportMeta.outerHTML,
        context: context,
        specificRecommendation: {
          title: 'Viewport Scaling Disabled',
          priority: priorityInfo.priority,
          wcagLevel: priorityInfo.level,
          wcagCriterion: '1.4.4',
          description: `Viewport meta tag at line ${lineNumber} prevents users from zooming, which is a major accessibility failure.`,
          element: viewportMeta.outerHTML,
          location: `${filePath}:${lineNumber}`,
          currentCode: context.current.trim(),
          suggestedFix: context.current.replace(
            content,
            'width=device-width, initial-scale=1'
          ),
          impact:
            'Users with visual impairments cannot zoom to read content, violating accessibility requirements',
          userImpact: getUserImpactStats('viewport-scaling'),
          wcagReference: 'WCAG 2.1 - 1.4.4 Resize Text',
          legalRisk:
            priorityInfo.legalRisk +
            ' - Required by WCAG Level AA and Section 508',
        },
      });
    }
  }

  return issues;
};

export const analyzeRepository = async (req, res) => {
  try {
    const config = await getGitConfig();
    const { githubToken, owner, repo } = config;

    const octokit = new Octokit({
      auth: githubToken,
    });

    // Set up SSE headers for real-time progress
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const sendProgress = (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    };

    sendProgress({ message: 'Fetching repository files...', pagesScanned: 0 });

    // Get repository tree
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true',
    });

    // Find HTML files
    const htmlFiles = tree.tree.filter(
      (file) =>
        file.type === 'blob' &&
        (file.path.endsWith('.html') || file.path.endsWith('.htm'))
    );

    if (htmlFiles.length === 0) {
      return res.write(
        `data: ${JSON.stringify({
          error: 'No HTML files found in repository',
          done: true,
        })}\n\n`
      );
    }

    sendProgress({
      message: `Found ${htmlFiles.length} HTML files. Analyzing...`,
      pagesScanned: 0,
      totalPages: htmlFiles.length,
    });

    const allIssues = [];
    const analyzedFiles = [];

    // Analyze each HTML file
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = htmlFiles[i];

      try {
        sendProgress({
          message: `Analyzing ${file.path}...`,
          pagesScanned: i,
          totalPages: htmlFiles.length,
          currentFile: file.path,
        });

        // Get file content
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        const htmlContent = Buffer.from(fileData.content, 'base64').toString();
        const issues = analyzeHTMLContent(htmlContent, file.path);

        allIssues.push(...issues);
        analyzedFiles.push({
          path: file.path,
          issues: issues.length,
          size: fileData.size,
        });

        sendProgress({
          message: `Analyzed ${file.path} - found ${issues.length} issues`,
          pagesScanned: i + 1,
          totalPages: htmlFiles.length,
          currentFile: file.path,
        });
      } catch (error) {
        logger.error('Error analyzing file', error, { filePath: file.path });
        sendProgress({
          message: `Error analyzing ${file.path}: ${error.message}`,
          pagesScanned: i + 1,
          totalPages: htmlFiles.length,
        });
      }
    }

    // Group issues by type
    const groupedIssues = {
      accessibility: allIssues.filter(
        (issue) => issue.type === 'accessibility'
      ),
      seo: allIssues.filter((issue) => issue.type === 'seo'),
      performance: allIssues.filter((issue) => issue.type === 'performance'),
      bestPractices: allIssues.filter(
        (issue) => issue.type === 'bestPractices'
      ),
    };

    // Calculate scores based on issues (simple scoring)
    const calculateScore = (issues) => {
      const maxScore = 100;
      const penalty = issues.reduce((total, issue) => {
        switch (issue.severity) {
          case 'high':
            return total + 15;
          case 'medium':
            return total + 8;
          case 'low':
            return total + 3;
          default:
            return total + 5;
        }
      }, 0);
      return Math.max(0, maxScore - penalty);
    };

    const results = {
      performance: {
        score: calculateScore(groupedIssues.performance),
        issues: groupedIssues.performance,
      },
      accessibility: {
        score: calculateScore(groupedIssues.accessibility),
        issues: groupedIssues.accessibility,
      },
      bestPractices: {
        score: calculateScore(groupedIssues.bestPractices),
        issues: groupedIssues.bestPractices,
      },
      seo: {
        score: calculateScore(groupedIssues.seo),
        issues: groupedIssues.seo,
      },
      scanStats: {
        pagesScanned: htmlFiles.length,
        totalPages: htmlFiles.length,
        scannedUrls: analyzedFiles.map((f) => f.path),
        analyzedFiles,
      },
      repository: {
        owner,
        repo,
        totalIssues: allIssues.length,
        filesAnalyzed: htmlFiles.length,
      },
      done: true,
    };

    res.write(`data: ${JSON.stringify(results)}\n\n`);
    res.end();
  } catch (error) {
    logger.error('Repository analysis failed', error);
    res.write(
      `data: ${JSON.stringify({
        error: `Repository analysis failed: ${error.message}`,
        done: true,
      })}\n\n`
    );
    res.end();
  }
};
