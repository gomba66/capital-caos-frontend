#!/usr/bin/env node

/**
 * Script to release the changelog by creating a new version
 * Usage: node scripts/release-changelog.js [version] [date]
 * Example: node scripts/release-changelog.js v1.0.3 2025-07-28
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");

function releaseChangelog(version, date) {
  if (!version || !date) {
    console.error("❌ Version and date required");
    console.log("Usage: node scripts/release-changelog.js [version] [date]");
    console.log("Example: node scripts/release-changelog.js v1.0.3 2025-07-28");
    process.exit(1);
  }

  // Validate version format
  if (!version.match(/^v\d+\.\d+\.\d+$/)) {
    console.error("❌ Invalid version format. Use format: v1.0.0");
    process.exit(1);
  }

  // Validate date format
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.error("❌ Invalid date format. Use format: YYYY-MM-DD");
    process.exit(1);
  }

  try {
    let changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");

    // Find [Unreleased] section
    const unreleasedIndex = changelog.indexOf("## [Unreleased]");
    if (unreleasedIndex === -1) {
      console.error("❌ [Unreleased] section not found");
      process.exit(1);
    }

    // Extract [Unreleased] content
    const nextSectionIndex = changelog.indexOf("\n## ", unreleasedIndex + 1);
    const unreleasedEnd =
      nextSectionIndex !== -1 ? nextSectionIndex : changelog.length;
    const unreleasedContent = changelog.substring(
      unreleasedIndex,
      unreleasedEnd
    );

    // Check if [Unreleased] has any entries
    const hasEntries = unreleasedContent.match(/^\s*[-*]\s+\*\*/gm);

    if (!hasEntries || hasEntries.length === 0) {
      console.log("ℹ️  [Unreleased] section is empty. No entries to release.");
      return;
    }

    // Create new version section
    const newVersionSection = `## [${version}] - ${date}\n\n${unreleasedContent.substring(
      unreleasedContent.indexOf("\n") + 1
    )}`;

    // Replace [Unreleased] with new version and empty [Unreleased]
    const emptyUnreleased = `## [Unreleased]

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

`;

    changelog =
      changelog.substring(0, unreleasedIndex) +
      emptyUnreleased +
      newVersionSection +
      changelog.substring(unreleasedEnd);

    // Write the updated CHANGELOG
    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.log(`✅ Changelog released: ${version} (${date})`);
    console.log(
      `📝 Moved ${hasEntries.length} entries from [Unreleased] to ${version}`
    );
  } catch (error) {
    console.error("❌ Error releasing changelog:", error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , version, date] = process.argv;
  releaseChangelog(version, date);
}

export { releaseChangelog };
