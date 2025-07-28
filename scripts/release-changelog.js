#!/usr/bin/env node

/**
 * Script to make CHANGELOG release
 * Usage: node scripts/release-changelog.js [version]
 *
 * Example: node scripts/release-changelog.js v1.2.3
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");

function releaseChangelog(version) {
  if (!version) {
    console.error("❌ Version required");
    console.log("Usage: node scripts/release-changelog.js [version]");
    console.log("Example: node scripts/release-changelog.js v1.2.3");
    process.exit(1);
  }

  if (!version.startsWith("v")) {
    version = `v${version}`;
  }

  try {
    // Leer el CHANGELOG actual
    let changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");

    // Verify that [Unreleased] section exists
    if (!changelog.includes("## [Unreleased]")) {
      console.error("❌ [Unreleased] section not found");
      process.exit(1);
    }

    // Get current date
    const currentDate = new Date().toISOString().split("T")[0];

    // Replace [Unreleased] with version and date
    changelog = changelog.replace(
      "## [Unreleased]",
      `## [${version}] - ${currentDate}`
    );

    // Add new [Unreleased] section at the beginning, after # Changelog
    const newUnreleasedSection =
      "\n## [Unreleased]\n\n### ✨ Added\n\n### 🐛 Fixed\n\n### 🎨 Enhanced\n\n### 🔧 Technical\n\n### 📱 Mobile Features\n\n### 🖥️ Desktop Features\n\n";

    // Insert after the first line (# Changelog)
    const lines = changelog.split("\n");
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      newLines.push(lines[i]);
      if (lines[i] === "# Changelog") {
        newLines.push(newUnreleasedSection);
      }
    }

    changelog = newLines.join("\n");

    // Write the updated CHANGELOG
    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.log(`✅ Release created: ${version} - ${currentDate}`);
    console.log("📝 New [Unreleased] section added for upcoming changes");
  } catch (error) {
    console.error("❌ Error making release:", error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , version] = process.argv;
  releaseChangelog(version);
}

export { releaseChangelog };
