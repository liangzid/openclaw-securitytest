#!/usr/bin/env node
/**
 * OpenClaw Attack Test Runner
 *
 * Run the attack test suite against an agent.
 *
 * Usage:
 *   # Dry run with mock agent
 *   node --import tsx src/security/attacks/run-attacks.ts --dry
 *
 *   # Run specific attacks
 *   node --import tsx src/security/attacks/run-attacks.ts --category prompt_injection
 *
 *   # Run critical severity only
 *   node --import tsx src/security/attacks/run-attacks.ts --severity critical
 */

import { parseArgs } from "node:util";
import {
  getAllAttacks,
  getAttacksByCategory,
  getAttacksBySeverity,
  getAttackStats,
  PROMPT_INJECTION_ATTACKS,
  ATTACK_SCENARIOS,
} from "./index.js";
import { runAllAttacks, runAttackScenario, type AgentRunner } from "./test-harness.js";
import { createTestEnv, createAttackTestConfig, withTestEnv } from "./test-env.js";
import { createMockAgent, createVulnerableMockAgent, createProtectedMockAgent } from "./mock-agent.js";

const args = parseArgs({
  options: {
    dry: { type: "boolean", short: "n", default: false },
    category: { type: "string", short: "c" },
    severity: { type: "string", short: "s" },
    target: { type: "string", short: "t" },
    list: { type: "boolean", short: "l", default: false },
    help: { type: "boolean", short: "h", default: false },
    id: { type: "string" },
    scenario: { type: "string" },
    vulnerable: { type: "boolean", default: false },
    protected: { type: "boolean", default: false },
  },
});

function printHelp() {
  console.log(`
OpenClaw Attack Test Runner

Usage:
  node --import tsx src/security/attacks/run-attacks.ts [options]

Options:
  -n, --dry              Dry run with mock agent (default)
  -l, --list             List available attacks
  -c, --category CAT     Filter by category (prompt_injection, indirect_prompt_injection, etc.)
  -s, --severity SEV     Filter by severity (low, medium, high, critical)
  -t, --target TARGET    Filter by target (agent, tool, session, etc.)
  --id ID                Run specific attack by ID
  --scenario ID          Run attack scenario
  --vulnerable           Use mock agent that always succeeds
  --protected            Use mock agent that always blocks
  -h, --help             Show this help

Examples:
  # List all attacks
  node --import tsx src/security/attacks/run-attacks.ts --list

  # Run all critical attacks
  node --import tsx src/security/attacks/run-attacks.ts --severity critical

  # Run prompt injection attacks only
  node --import tsx src/security/attacks/run-attacks.ts --category prompt_injection

  # Test a vulnerable agent
  node --import tsx src/security/attacks/run-attacks.ts --vulnerable

  # Run attack scenario
  node --import tsx src/security/attacks/run-attacks.ts --scenario scenario-001
`);
}

function listAttacks() {
  const stats = getAttackStats();
  console.log("\n📊 ATTACK TEST SUITE\n");
  console.log(`Total attacks: ${stats.total}`);
  console.log("\nBy category:");
  for (const [cat, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log("\nBy severity:");
  for (const [sev, count] of Object.entries(stats.bySeverity)) {
    console.log(`  ${sev}: ${count}`);
  }

  console.log("\n📋 ATTACK LIST:\n");
  const allAttacks = getAllAttacks();
  for (const attack of allAttacks) {
    const sevColor =
      attack.severity === "critical" ? "🔴" :
      attack.severity === "high" ? "🟠" :
      attack.severity === "medium" ? "🟡" : "⚪";
    console.log(
      `${sevColor} [${attack.severity.toUpperCase()}] ${attack.id}`
    );
    console.log(`   ${attack.name}`);
    console.log(`   Category: ${attack.category}, Target: ${attack.target}`);
    if (attack.atlasTechnique) {
      console.log(`   ATLAS: ${attack.atlasTechnique}`);
    }
    console.log();
  }

  console.log("\n🎬 ATTACK SCENARIOS:\n");
  for (const scenario of ATTACK_SCENARIOS) {
    console.log(`🎬 ${scenario.id} - ${scenario.name}`);
    console.log(`   Severity: ${scenario.severity}, Steps: ${scenario.steps.length}`);
    console.log(`   ${scenario.description}`);
    console.log();
  }
}

async function main() {
  if (args.values.help) {
    printHelp();
    return;
  }

  if (args.values.list) {
    listAttacks();
    return;
  }

  // Create test environment
  console.log("🧪 Creating isolated test environment...");
  const testEnv = createTestEnv();
  console.log(`   State dir: ${testEnv.stateDir}`);

  // Write test config
  await testEnv.writeConfig(createAttackTestConfig());
  console.log("   Config written");

  // Select agent
  let agent: AgentRunner;
  if (args.values.vulnerable) {
    console.log("🤖 Using vulnerable mock agent (all attacks succeed)");
    agent = createVulnerableMockAgent();
  } else if (args.values.protected) {
    console.log("🛡️  Using protected mock agent (all attacks blocked)");
    agent = createProtectedMockAgent();
  } else {
    console.log("🤖 Using default mock agent (50% success rate)");
    agent = createMockAgent({ successRate: 0.5, detectionRate: 0.3 });
  }

  // Run scenario if specified
  if (args.values.scenario) {
    const scenario = ATTACK_SCENARIOS.find((s) => s.id === args.values.scenario);
    if (!scenario) {
      console.error(`❌ Scenario not found: ${args.values.scenario}`);
      await testEnv.cleanup();
      process.exit(1);
    }
    console.log(`\n🎬 Running scenario: ${scenario.name}`);
    const results = await runAttackScenario(scenario, agent);
    console.log(`\n✅ Scenario complete: ${results.length} steps executed`);
    await testEnv.cleanup();
    return;
  }

  // Filter attacks
  let attacks = getAllAttacks();

  if (args.values.id) {
    attacks = attacks.filter((a) => a.id === args.values.id);
    if (attacks.length === 0) {
      console.error(`❌ Attack not found: ${args.values.id}`);
      await testEnv.cleanup();
      process.exit(1);
    }
  } else if (args.values.category) {
    attacks = getAttacksByCategory(args.values.category as any);
  } else if (args.values.severity) {
    attacks = attacks.filter((a) => a.severity === args.values.severity);
  } else if (args.values.target) {
    attacks = attacks.filter((a) => a.target === args.values.target);
  }

  if (attacks.length === 0) {
    console.log("No attacks matched the filters.");
    await testEnv.cleanup();
    return;
  }

  // Run attacks
  console.log(`\n🚀 Running ${attacks.length} attacks...\n`);

  // Patch mock agent to know which attack is running
  if ("_setCurrentAttack" in agent) {
    const originalSend = agent.sendMessage;
    (agent as any).sendMessage = async (msg: string) => {
      // We don't have the attack here - this is just a mock
      return originalSend.call(agent, msg);
    };
  }

  const results = await runAllAttacks(agent, {
    timeoutMs: 5000,
    continueOnFailure: true,
  });

  console.log("\n" + "═".repeat(70));
  console.log("📊 FINAL RESULTS");
  console.log("─".repeat(70));
  console.log(`Total attacks:    ${results.totalAttacks}`);
  console.log(`⚠️ Succeeded:       ${results.successfulAttacks}`);
  console.log(`🛡️ Blocked:         ${results.blockedAttacks}`);
  console.log(`❌ Failed:          ${results.failedAttacks}`);
  console.log(`⏱️ Duration:       ${results.durationMs}ms`);

  if (results.successfulAttacks > 0) {
    console.log("\n⚠️ ATTACKS THAT SUCCEEDED (bypassed defenses):");
    for (const result of results.results) {
      if (result.status === "success") {
        console.log(`   - ${result.attackId}`);
      }
    }
  }

  // Cleanup
  console.log("\n🧹 Cleaning up...");
  await testEnv.cleanup();
  console.log("   Done!");

  console.log("\n✅ Test complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

export { main };
