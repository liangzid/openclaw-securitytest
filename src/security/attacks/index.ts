/**
 * OpenClaw Attack Test Suite
 *
 * A comprehensive collection of attack payloads for testing OpenClaw's security.
 *
 * Usage:
 *   import { getAllAttacks, getAttacksByCategory, runAttack } from "./attacks/index.js";
 *
 *   // Get all attacks
 *   const allAttacks = getAllAttacks();
 *
 *   // Get attacks by category
 *   const piAttacks = getAttacksByCategory("prompt_injection");
 *
 *   // Run an attack (implement your own runner)
 *   const result = await runAttack(attack, agentRunner);
 */

export * from "./types.js";
export { PROMPT_INJECTION_ATTACKS } from "./prompt-injection.js";
export { INDIRECT_INJECTION_ATTACKS } from "./indirect-injection.js";
export { TOOL_INJECTION_ATTACKS } from "./tool-injection.js";
export { OTHER_ATTACKS, ATTACK_SCENARIOS } from "./other-attacks.js";
export { EXTENDED_PROMPT_INJECTION, getAllExtendedAttacks, getExtendedAttacksByCategory, getExtendedAttacksBySeverity } from "./extended-payloads.js";
export * from "./test-harness.js";
export * from "./test-env.js";
export * from "./mock-agent.js";

import type { AttackPrompt, AttackCategory } from "./types.js";
import { PROMPT_INJECTION_ATTACKS } from "./prompt-injection.js";
import { INDIRECT_INJECTION_ATTACKS } from "./indirect-injection.js";
import { TOOL_INJECTION_ATTACKS } from "./tool-injection.js";
import { OTHER_ATTACKS } from "./other-attacks.js";
import { EXTENDED_PROMPT_INJECTION } from "./extended-payloads.js";

/**
 * Get all attack payloads (core suite only)
 */
export function getAllAttacks(): AttackPrompt[] {
  return [
    ...PROMPT_INJECTION_ATTACKS,
    ...INDIRECT_INJECTION_ATTACKS,
    ...TOOL_INJECTION_ATTACKS,
    ...OTHER_ATTACKS,
  ];
}

/**
 * Get ALL attacks including extended benchmark payloads
 */
export function getAllAttacksWithExtended(): AttackPrompt[] {
  return [
    ...PROMPT_INJECTION_ATTACKS,
    ...INDIRECT_INJECTION_ATTACKS,
    ...TOOL_INJECTION_ATTACKS,
    ...OTHER_ATTACKS,
    ...EXTENDED_PROMPT_INJECTION,
  ];
}

/**
 * Get attacks by category
 */
export function getAttacksByCategory(category: AttackCategory): AttackPrompt[] {
  return getAllAttacks().filter((a) => a.category === category);
}

/**
 * Get attacks by severity
 */
export function getAttacksBySeverity(severity: "low" | "medium" | "high" | "critical"): AttackPrompt[] {
  return getAllAttacks().filter((a) => a.severity === severity);
}

/**
 * Get attacks by target
 */
export function getAttacksByTarget(target: AttackPrompt["target"]): AttackPrompt[] {
  return getAllAttacks().filter((a) => a.target === target);
}

/**
 * Get statistics about the attack suite
 */
export function getAttackStats() {
  const all = getAllAttacks();
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byTarget: Record<string, number> = {};

  for (const attack of all) {
    byCategory[attack.category] = (byCategory[attack.category] || 0) + 1;
    bySeverity[attack.severity] = (bySeverity[attack.severity] || 0) + 1;
    byTarget[attack.target] = (byTarget[attack.target] || 0) + 1;
  }

  return {
    total: all.length,
    byCategory,
    bySeverity,
    byTarget,
  };
}

/**
 * MITRE ATLAS Technique Mapping
 */
export const ATLAS_TECHNIQUES: Record<string, string> = {
  "AML.T0002": "Reconnaissance",
  "AML.T0004": "Initial Access",
  "AML.T0005": "Execution",
  "AML.T0006": "Persistence",
  "AML.T0007": "Defense Evasion",
  "AML.T0008": "Discovery",
  "AML.T0009": "Collection",
  "AML.T0010": "Exfiltration",
  "AML.T0011": "Impact",
  "AML.T0040": "AI Model Inference API Access",
  "AML.T0043": "Craft Adversarial Data",
  "AML.T0051.000": "LLM Prompt Injection: Direct",
  "AML.T0051.001": "LLM Prompt Injection: Indirect",
};
