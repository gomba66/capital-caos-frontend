#!/usr/bin/env node

/**
 * Test script to verify changelog workflow functionality
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateChangelog } from "./update-changelog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");

function testChangelogWorkflow() {
  console.log("🧪 Testing changelog workflow...\n");

  // Test 1: Verify [Unreleased] has empty sections
  console.log("1. Testing [Unreleased] structure...");
  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const unreleasedSection = changelog.match(
    /## \[Unreleased\]([\s\S]*?)(?=## \[)/
  );

  if (!unreleasedSection) {
    console.error("❌ [Unreleased] section not found");
    return false;
  }

  const hasSections =
    unreleasedSection[1].includes("### ✨ Added") &&
    unreleasedSection[1].includes("### 🐛 Fixed") &&
    unreleasedSection[1].includes("### 🎨 Enhanced") &&
    unreleasedSection[1].includes("### 🔧 Technical") &&
    unreleasedSection[1].includes("### 📱 Mobile Features") &&
    unreleasedSection[1].includes("### 🖥️ Desktop Features");

  if (!hasSections) {
    console.error("❌ [Unreleased] section missing required categories");
    return false;
  }

  console.log("✅ [Unreleased] section has all required categories");

  // Test 2: Verify workflow detection (should pass when empty)
  console.log("\n2. Testing workflow detection (empty [Unreleased])...");
  const emptyEntries = unreleasedSection[1].match(/^\s*[-*]\s+\*\*/gm);

  if (emptyEntries && emptyEntries.length > 0) {
    console.error(
      "❌ [Unreleased] section contains entries when it should be empty"
    );
    console.error("Found entries:", emptyEntries);
    return false;
  }

  console.log("✅ Workflow correctly detects empty [Unreleased] section");

  // Test 3: Add an entry and verify it's detected
  console.log("\n3. Testing entry addition and detection...");
  updateChangelog("added", "Test entry for workflow validation");

  const updatedChangelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const updatedUnreleasedSection = updatedChangelog.match(
    /## \[Unreleased\]([\s\S]*?)(?=## \[)/
  );
  const testEntries = updatedUnreleasedSection[1].match(/^\s*[-*]\s+\*\*/gm);

  if (!testEntries || testEntries.length === 0) {
    console.error("❌ Entry was not added to [Unreleased] section");
    return false;
  }

  console.log("✅ Entry successfully added to [Unreleased] section");

  // Test 4: Verify workflow would detect the entry
  console.log("\n4. Testing workflow detection (with entry)...");
  const workflowDetection =
    updatedUnreleasedSection[1].match(/^\s*[-*]\s+\*\*/gm);

  if (!workflowDetection || workflowDetection.length === 0) {
    console.error("❌ Workflow would not detect the added entry");
    return false;
  }

  console.log("✅ Workflow correctly detects entries in [Unreleased] section");

  // Clean up: Remove test entry
  console.log("\n5. Cleaning up test entry...");
  const cleanedChangelog = updatedChangelog.replace(
    /- \*\*Test entry for workflow validation\*\*\n/,
    ""
  );
  fs.writeFileSync(CHANGELOG_PATH, cleanedChangelog);
  console.log("✅ Test entry removed");

  console.log(
    "\n🎉 All tests passed! Changelog workflow is working correctly."
  );
  return true;
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = testChangelogWorkflow();
  process.exit(success ? 0 : 1);
}

export { testChangelogWorkflow };
