#!/usr/bin/env node

/**
 * Script to make CHANGELOG release
 * Usage: node scripts/release-changelog.js [version]
 *
 * Example: node scripts/release-changelog.js v1.2.3
 */

const fs = require("fs");
const path = require("path");

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

    // Add new [Unreleased] section at the end
    changelog +=
      "\n## [Unreleased]\n\n### ✨ Added\n\n### 🐛 Fixed\n\n### 🎨 Enhanced\n\n### 🔧 Technical\n\n### 📱 Mobile Features\n\n### 🖥️ Desktop Features\n\n";

    // Write the updated CHANGELOG
    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.log(`✅ Release created: ${version} - ${currentDate}`);
    console.log("📝 New [Unreleased] section added for upcoming changes");
  } catch (error) {
    console.error("❌ Error making release:", error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const [, , version] = process.argv;
  releaseChangelog(version);
}

module.exports = { releaseChangelog };
