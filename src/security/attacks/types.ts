/**
 * OpenClaw Attack Test Suite
 *
 * This module defines types and structures for testing attacks against OpenClaw.
 * Based on the threat model in docs/security/THREAT-MODEL-ATLAS.md
 */

export type AttackCategory =
  | "prompt_injection"
  | "indirect_prompt_injection"
  | "tool_argument_injection"
  | "data_exfiltration"
  | "privilege_escalation"
  | "session_hijacking"
  | "resource_exhaustion"
  | "skill_poisoning"
  | "output_backdoor";

export type AttackSeverity = "low" | "medium" | "high" | "critical";

export type AttackStatus = "pending" | "running" | "success" | "failed" | "blocked";

export type AttackTarget = "agent" | "gateway" | "channel" | "tool" | "session" | "memory";

export interface AttackPrompt {
  id: string;
  name: string;
  description: string;
  category: AttackCategory;
  severity: AttackSeverity;
  target: AttackTarget;
  atlasTechnique?: string; // MITRE ATLAS technique ID
  payload: string;
  variations?: string[];
  expectedBehavior?: {
    shouldSucceed?: boolean;
    shouldTriggerAlert?: boolean;
    checkPattern?: RegExp;
  };
  references?: string[];
}

export interface AttackResult {
  attackId: string;
  status: AttackStatus;
  timestampMs: number;
  durationMs?: number;
  output?: string;
  error?: string;
  detected?: boolean;
  blocked?: boolean;
  evidence?: string[];
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: AttackSeverity;
  steps: AttackPrompt[];
  preconditions?: string[];
  postconditions?: string[];
}
