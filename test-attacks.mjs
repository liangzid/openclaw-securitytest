#!/usr/bin/env node
/**
 * Simple attack test runner (no tsx required)
 * Usage: node test-attacks.mjs
 */

import { getAllAttacks, getAttackStats, ATTACK_SCENARIOS } from "./dist/security/attacks/index.js";
import fs from "node:fs";
import path from "node:path";

console.log("\n" + "═".repeat(70));
console.log("🔓 OPENCLAW ATTACK TEST SUITE");
console.log("═".repeat(70));

// Check if dist exists
if (!fs.existsSync("dist")) {
  console.log("\n⚠️  dist/ directory not found. Building first...\n");
  process.exit(1);
}

const stats = getAttackStats();
console.log("\n📊 SUITE STATISTICS");
console.log("─".repeat(70));
console.log(`Total attacks:    ${stats.total}`);
console.log("\nBy category:");
for (const [cat, count] of Object.entries(stats.byCategory)) {
  console.log(`  ${cat}: ${count}`);
}
console.log("\nBy severity:");
for (const [sev, count] of Object.entries(stats.bySeverity)) {
  console.log(`  ${sev}: ${count}`);
}

console.log("\n" + "═".repeat(70));
console.log("📋 ATTACK PAYLOAD EXAMPLES");
console.log("═".repeat(70));

const allAttacks = getAllAttacks();
const sampleAttacks = [
  allAttacks.find((a) => a.id === "pi-001"),
  allAttacks.find((a) => a.id === "ipi-001"),
  allAttacks.find((a) => a.id === "ti-003"),
  allAttacks.find((a) => a.id === "exfil-001"),
].filter(Boolean);

for (const attack of sampleAttacks) {
  const sevColor =
    attack.severity === "critical" ? "🔴" :
    attack.severity === "high" ? "🟠" :
    attack.severity === "medium" ? "🟡" : "⚪";

  console.log(`\n${sevColor} [${attack.severity.toUpperCase()}] ${attack.id} - ${attack.name}`);
  console.log(`   Category: ${attack.category}`);
  if (attack.atlasTechnique) {
    console.log(`   ATLAS: ${attack.atlasTechnique}`);
  }
  console.log(`\n   Description: ${attack.description}`);
  console.log("\n   Payload:");
  console.log("   ──────────────────────────────────────────");
  console.log(attack.payload.split("\n").map((l) => `   ${l}`).join("\n"));
  console.log("   ──────────────────────────────────────────");

  if (attack.variations && attack.variations.length > 0) {
    console.log("\n   Variations:");
    for (const v of attack.variations.slice(0, 2)) {
      console.log(`   • ${v.slice(0, 80)}${v.length > 80 ? "..." : ""}`);
    }
    if (attack.variations.length > 2) {
      console.log(`   ... and ${attack.variations.length - 2} more`);
    }
  }
  console.log();
}

console.log("\n" + "═".repeat(70));
console.log("🎬 ATTACK SCENARIOS");
console.log("═".repeat(70));

for (const scenario of ATTACK_SCENARIOS) {
  console.log(`\n🎬 ${scenario.id} - ${scenario.name}`);
  console.log(`   Severity: ${scenario.severity}`);
  console.log(`   ${scenario.description}`);
  console.log(`   Steps: ${scenario.steps.length}`);
  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    console.log(`   ${i + 1}. ${step.name}`);
  }
}

console.log("\n" + "═".repeat(70));
console.log("📁 FILE STRUCTURE");
console.log("═".repeat(70));
console.log(`
src/security/attacks/
├── types.ts              # Type definitions
├── index.ts              # Main export
├── prompt-injection.ts   # 10 direct prompt injection attacks
├── indirect-injection.ts # 8 indirect prompt injection attacks
├── tool-injection.ts     # 10 tool injection & exfiltration attacks
├── other-attacks.ts      # 11 other attacks + 2 scenarios
├── test-harness.ts       # Test harness
├── test-env.ts           # Isolated environment setup
├── mock-agent.ts         # Mock agent for testing
├── run-attacks.ts        # CLI runner
└── README.md             # Documentation
`);

console.log("\n" + "═".repeat(70));
console.log("💡 USAGE");
console.log("─".repeat(70));
console.log(`
1. Build the project first:
   pnpm build

2. To use in your code:
   import { getAllAttacks, createTestEnv, runAllAttacks }
     from "./src/security/attacks/index.js";

3. Get all attacks:
   const all = getAllAttacks();

4. Filter by category/severity:
   const critical = getAttacksBySeverity("critical");
   const piAttacks = getAttacksByCategory("prompt_injection");

5. Create isolated environment:
   const env = createTestEnv();
   await env.writeConfig(config);
   // ... run tests ...
   await env.cleanup();

6. Run attacks with mock agent:
   const agent = createMockAgent();
   const results = await runAllAttacks(agent);
`);

console.log("═".repeat(70));
console.log("✅ Attack test suite is ready!");
console.log("═".repeat(70));
