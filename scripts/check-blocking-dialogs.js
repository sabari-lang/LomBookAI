#!/usr/bin/env node
/**
 * Check for blocking dialogs (alert, confirm, prompt) in src/
 * Fails build if any blocking dialogs are found.
 *
 * Electron-safe: plain Node FS scan (no AST), but reduces false positives.
 */

const fs = require("fs");
const path = require("path");

// Patterns that are ALWAYS blocking
// Use negative lookbehind so `window.alert(` does NOT also match `alert(`.
const ALWAYS_BLOCKING_PATTERNS = [
  { pattern: /(?<!\.)\balert\s*\(/g, name: "alert(" },
  { pattern: /\bwindow\.alert\s*\(/g, name: "window.alert(" },

  { pattern: /(?<!\.)\bprompt\s*\(/g, name: "prompt(" },
  { pattern: /\bwindow\.prompt\s*\(/g, name: "window.prompt(" },

  // Only flag window.confirm explicitly; standalone confirm handled separately
  { pattern: /\bwindow\.confirm\s*\(/g, name: "window.confirm(" },
];

// Patterns that might be our helper confirm()
// Only flag confirm( if NOT imported from confirm helper.
// Also ignore obj.confirm( by negative lookbehind.
const CONDITIONAL_PATTERNS = [
  {
    pattern: /(?<!\.)\bconfirm\s*\(/g,
    name: "confirm(",
    importCheck: /from\s+['"][^'"]*(utils\/confirm|\/confirm)['"]/,
  },
];

// Exclude paths
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /build/,
  /\.git/,
  /scripts\/check-blocking-dialogs\.js$/, // exclude itself
];

// Allowed patterns (OK usage)
const ALLOWED_PATTERNS = [
  /\/\/.*alert/, // comments mentioning alert
  /notifySuccess|notifyError|notifyInfo|notifyWarning/,
  /from.*notifications/,
  /^\s*import\s+.*from\s+['"][^'"]*confirm['"]\s*;?\s*$/, // import lines only
  /^\s*export\s+.*confirm/,
  /setConfirmContext|setNotificationContext/,
  /confirmContext|notificationContext/,
  /Replaces alert\(\) calls/,
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some((p) => p.test(filePath));
}

// Remove anything after // if not inside a string (simple safe approach)
function stripSingleLineComment(line) {
  const idx = line.indexOf("//");
  if (idx === -1) return line;

  // Very lightweight: if we have an odd number of quotes before //, assume inside string
  const before = line.slice(0, idx);
  const quoteCount = (before.match(/["']/g) || []).length;
  if (quoteCount % 2 === 1) return line; // likely inside string

  return before; // strip comment part
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  const hasConfirmImport = CONDITIONAL_PATTERNS[0].importCheck.test(content);

  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Track multiline block comments safely
    let line = rawLine;

    // If we are inside a block comment, check if it ends on this line
    if (inBlockComment) {
      const endIdx = line.indexOf("*/");
      if (endIdx !== -1) {
        inBlockComment = false;
        // continue scanning after block comment ends
        line = line.slice(endIdx + 2);
      } else {
        continue; // entire line is within block comment
      }
    }

    // Remove inline block comments and detect block comment start
    while (true) {
      const startIdx = line.indexOf("/*");
      if (startIdx === -1) break;

      const endIdx = line.indexOf("*/", startIdx + 2);
      if (endIdx === -1) {
        // block comment starts and continues to next line
        line = line.slice(0, startIdx);
        inBlockComment = true;
        break;
      } else {
        // remove block comment section and continue
        line = line.slice(0, startIdx) + line.slice(endIdx + 2);
      }
    }

    // Strip // comments (best effort)
    line = stripSingleLineComment(line);

    // Skip JSDoc continuation lines
    if (rawLine.trim().startsWith("*")) continue;

    // Allowlist shortcuts
    if (ALLOWED_PATTERNS.some((p) => p.test(rawLine))) continue;

    // Check always-blocking patterns
    for (const { pattern, name } of ALWAYS_BLOCKING_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      for (const m of matches) {
        issues.push({
          file: filePath,
          line: i + 1,
          pattern: name,
          content: rawLine.trim(),
        });
      }
    }

    // Check confirm() only if helper is NOT imported
    if (!hasConfirmImport) {
      for (const { pattern, name } of CONDITIONAL_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = [...line.matchAll(pattern)];
        for (const m of matches) {
          issues.push({
            file: filePath,
            line: i + 1,
            pattern: name,
            content: rawLine.trim(),
          });
        }
      }
    }
  }

  return issues;
}

function scanDirectory(dirPath) {
  const issues = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (shouldExcludeFile(fullPath)) continue;

    if (entry.isDirectory()) {
      issues.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      issues.push(...scanFile(fullPath));
    }
  }

  return issues;
}

// Main
const srcDir = path.join(__dirname, "..", "src");

if (!fs.existsSync(srcDir)) {
  console.error("Error: src/ directory not found");
  process.exit(1);
}

console.log("Scanning src/ for blocking dialogs...\n");

const issues = scanDirectory(srcDir);

if (issues.length === 0) {
  console.log("✅ No blocking dialogs found. Build can proceed.");
  process.exit(0);
}

const issuesByFile = {};
for (const issue of issues) {
  if (!issuesByFile[issue.file]) issuesByFile[issue.file] = [];
  issuesByFile[issue.file].push(issue);
}

console.error("❌ Blocking dialogs found! Build cannot proceed.\n");
console.error(
  `Found ${issues.length} blocking dialog call(s) in ${Object.keys(issuesByFile).length} file(s):\n`
);

Object.keys(issuesByFile)
  .sort()
  .forEach((file) => {
    const fileIssues = issuesByFile[file];
    console.error(`  ${file} (${fileIssues.length} issue(s)):`);

    fileIssues.forEach((issue) => {
      console.error(`    Line ${issue.line}: ${issue.pattern}`);
      console.error(`      ${issue.content}`);
    });
    console.error("");
  });

console.error("\nPlease replace all blocking dialogs:");
console.error("  - alert() -> notifySuccess() / notifyError() / notifyInfo()");
console.error("  - window.confirm() -> await confirm()");
console.error("  - prompt() -> use a form or input component\n");

process.exit(1);
