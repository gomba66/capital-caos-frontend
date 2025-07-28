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

function ensureUnreleasedSections(changelog) {
  const unreleasedIndex = changelog.indexOf("## [Unreleased]");
  if (unreleasedIndex === -1) {
    throw new Error("[Unreleased] section not found");
  }

  // Find the end of [Unreleased] section (next ## or end of file)
  const nextSectionIndex = changelog.indexOf("\n## ", unreleasedIndex + 1);
  const unreleasedEnd =
    nextSectionIndex !== -1 ? nextSectionIndex : changelog.length;

  const unreleasedContent = changelog.substring(unreleasedIndex, unreleasedEnd);

  // Check if sections already exist
  const hasSections = Object.values(TITLES).some((title) =>
    unreleasedContent.includes(
      `### ${
        EMOJIS[Object.keys(TITLES).find((key) => TITLES[key] === title)]
      } ${title}`
    )
  );

  if (!hasSections) {
    // Create all sections in [Unreleased]
    const sections = Object.entries(TITLES)
      .map(([type, title]) => `\n### ${EMOJIS[type]} ${title}\n`)
      .join("");

    const newUnreleasedContent = `## [Unreleased]\n${sections}`;

    // Replace the [Unreleased] section
    changelog =
      changelog.substring(0, unreleasedIndex) +
      newUnreleasedContent +
      changelog.substring(unreleasedEnd);
  }

  return changelog;
}

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

    // Ensure [Unreleased] has all sections
    changelog = ensureUnreleasedSections(changelog);

    // Find the [Unreleased] section
    const unreleasedIndex = changelog.indexOf("## [Unreleased]");
    if (unreleasedIndex === -1) {
      console.error("❌ [Unreleased] section not found");
      process.exit(1);
    }

    // Find the specific type section within [Unreleased]
    const sectionStart = changelog.indexOf(
      `### ${EMOJIS[type]} ${TITLES[type]}`,
      unreleasedIndex
    );

    if (sectionStart === -1) {
      console.error(`❌ Section for type '${type}' not found in [Unreleased]`);
      process.exit(1);
    }

    // Find the end of the section (next ### or end of [Unreleased])
    const nextSection = changelog.indexOf("\n### ", sectionStart + 1);
    const unreleasedEnd = changelog.indexOf("\n## ", unreleasedIndex + 1);
    const sectionEnd =
      nextSection !== -1 && nextSection < unreleasedEnd
        ? nextSection
        : unreleasedEnd !== -1
        ? unreleasedEnd
        : changelog.length;

    // Insert the new entry at the beginning of the section
    const newEntry = `- **${description}**\n`;
    changelog =
      changelog.slice(
        0,
        sectionStart + `### ${EMOJIS[type]} ${TITLES[type]}`.length + 1
      ) +
      newEntry +
      changelog.slice(
        sectionStart + `### ${EMOJIS[type]} ${TITLES[type]}`.length + 1
      );

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
