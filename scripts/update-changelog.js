#!/usr/bin/env node

/**
 * Script to automatically update the CHANGELOG
 * Usage: node scripts/update-changelog.js [type] [description]
 *
 * Available types:
 * - added: New functionality
 * - fixed: Bug fix
 * - enhanced: UX/UI improvement
 * - technical: Technical change
 * - mobile: Mobile feature
 * - desktop: Desktop feature
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");

// Emojis para cada tipo
const EMOJIS = {
  added: "✨",
  fixed: "🐛",
  enhanced: "🎨",
  technical: "🔧",
  mobile: "📱",
  desktop: "🖥️",
};

// Titles in English
const TITLES = {
  added: "Added",
  fixed: "Fixed",
  enhanced: "Enhanced",
  technical: "Technical",
  mobile: "Mobile Features",
  desktop: "Desktop Features",
};

function updateChangelog(type, description) {
  if (!EMOJIS[type]) {
    console.error(`❌ Invalid type: ${type}`);
    console.log("Available types:", Object.keys(EMOJIS).join(", "));
    process.exit(1);
  }

  if (!description) {
    console.error("❌ Description required");
    console.log("Usage: node scripts/update-changelog.js [type] [description]");
    process.exit(1);
  }

  try {
    // Leer el CHANGELOG actual
    let changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");

    // Find the [Unreleased] section
    const unreleasedIndex = changelog.indexOf("## [Unreleased]");
    if (unreleasedIndex === -1) {
      console.error("❌ [Unreleased] section not found");
      process.exit(1);
    }

    // Find the specific type section
    const sectionStart = changelog.indexOf(
      `### ${EMOJIS[type]} ${TITLES[type]}`,
      unreleasedIndex
    );
    if (sectionStart === -1) {
      // If section doesn't exist, create it after the first section
      const firstSectionEnd = changelog.indexOf("\n\n", unreleasedIndex) + 2;
      const newSection = `\n### ${EMOJIS[type]} ${TITLES[type]}\n- **${description}**\n`;
      changelog =
        changelog.slice(0, firstSectionEnd) +
        newSection +
        changelog.slice(firstSectionEnd);
    } else {
      // Find the end of the section
      const nextSection = changelog.indexOf("\n### ", sectionStart + 1);
      const sectionEnd =
        nextSection !== -1
          ? nextSection
          : changelog.indexOf("\n\n", sectionStart);

      // Insert the new entry
      const newEntry = `- **${description}**\n`;
      changelog =
        changelog.slice(0, sectionEnd) + newEntry + changelog.slice(sectionEnd);
    }

    // Write the updated CHANGELOG
    fs.writeFileSync(CHANGELOG_PATH, changelog);

    console.log(`✅ CHANGELOG updated: ${EMOJIS[type]} ${description}`);
  } catch (error) {
    console.error("❌ Error updating CHANGELOG:", error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , type, ...descriptionParts] = process.argv;
  const description = descriptionParts.join(" ");

  updateChangelog(type, description);
}

export { updateChangelog };
