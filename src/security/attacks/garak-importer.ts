/**
 * Garak Data Importer
 *
 * This module imports real attack payloads from the Garak framework.
 * To use this, you need to have Garak cloned locally.
 *
 * Usage:
 *   1. Clone Garak: git clone https://github.com/leondz/garak.git /tmp/garak
 *   2. Run the import script to generate TypeScript payload files
 *
 * Sources:
 *   - inthewild_jailbreak_llms.json: 666 real-world jailbreak prompts
 *   - dan/*.json: DAN 6.0-11.0, DUDE, STAN, Dev Mode, etc.
 *   - payloads/*.json: Various attack payloads
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Default path to Garak clone
const DEFAULT_GARAK_PATH = "/tmp/garak";

export interface GarakImportOptions {
  garakPath?: string;
  outputPath?: string;
  limit?: number;
}

/**
 * Import DanInTheWild jailbreaks (666 prompts)
 */
export function importDanInTheWild(options: GarakImportOptions = {}) {
  const garakPath = options.garakPath || DEFAULT_GARAK_PATH;
  const filePath = path.join(garakPath, "garak/data/inthewild_jailbreak_llms.json");

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as string[];
  const limit = options.limit || data.length;

  console.log(`Importing ${Math.min(limit, data.length)} DanInTheWild jailbreaks...`);

  return data.slice(0, limit).map((prompt, index) => ({
    id: `garak-wild-${String(index + 1).padStart(3, "0")}`,
    name: `DanInTheWild Jailbreak ${index + 1}`,
    description: "Real-world jailbreak prompt from DanInTheWild dataset",
    category: "prompt_injection" as const,
    severity: "critical" as const,
    target: "agent" as const,
    atlasTechnique: "AML.T0051.000",
    payload: prompt.replace(/\{generator\.name\}/g, "Assistant"),
    references: ["https://arxiv.org/abs/2308.03825", "Garak DanInTheWild"],
  }));
}

/**
 * Import DAN variants from dan/ directory
 */
export function importDanVariants(options: GarakImportOptions = {}) {
  const garakPath = options.garakPath || DEFAULT_GARAK_PATH;
  const danDir = path.join(garakPath, "garak/data/dan");

  if (!fs.existsSync(danDir)) {
    console.warn(`Directory not found: ${danDir}`);
    return [];
  }

  const danFiles = fs.readdirSync(danDir).filter((f) => f.endsWith(".json"));
  const allPrompts: any[] = [];

  for (const file of danFiles) {
    const filePath = path.join(danDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as string[];
    const variantName = path.basename(file, ".json");

    console.log(`Importing ${data.length} prompts from ${file}...`);

    data.forEach((prompt, index) => {
      allPrompts.push({
        id: `garak-dan-${variantName.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
        name: `${variantName} Variant ${index + 1}`,
        description: `${variantName} jailbreak prompt from Garak`,
        category: "prompt_injection" as const,
        severity: "critical" as const,
        target: "agent" as const,
        atlasTechnique: "AML.T0051.000",
        payload: prompt.replace(/\{generator\.name\}/g, "Assistant"),
        references: ["Garak DAN probes"],
      });
    });
  }

  return allPrompts;
}

/**
 * Import payloads from payloads/ directory
 */
export function importPayloads(options: GarakImportOptions = {}) {
  const garakPath = options.garakPath || DEFAULT_GARAK_PATH;
  const payloadsDir = path.join(garakPath, "garak/data/payloads");

  if (!fs.existsSync(payloadsDir)) {
    console.warn(`Directory not found: ${payloadsDir}`);
    return [];
  }

  const payloadFiles = fs.readdirSync(payloadsDir).filter((f) => f.endsWith(".json"));
  const allPrompts: any[] = [];

  for (const file of payloadFiles) {
    const filePath = path.join(payloadsDir, file);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const payloadName = path.basename(file, ".json");

      // Handle different payload formats
      let prompts: string[] = [];
      if (Array.isArray(data)) {
        prompts = data;
      } else if (data.prompts && Array.isArray(data.prompts)) {
        prompts = data.prompts;
      } else if (typeof data === "object") {
        prompts = Object.values(data).filter((v): v is string => typeof v === "string");
      }

      if (prompts.length > 0) {
        console.log(`Importing ${prompts.length} prompts from ${file}...`);

        prompts.forEach((prompt, index) => {
          allPrompts.push({
            id: `garak-payload-${payloadName}-${String(index + 1).padStart(2, "0")}`,
            name: `${payloadName} Payload ${index + 1}`,
            description: `Attack payload from Garak's ${payloadName} dataset`,
            category: getCategoryForPayload(payloadName),
            severity: getSeverityForPayload(payloadName),
            target: "agent" as const,
            atlasTechnique: getAtlasTechniqueForPayload(payloadName),
            payload: prompt.replace(/\{generator\.name\}/g, "Assistant"),
            references: ["Garak payloads"],
          });
        });
      }
    } catch (e) {
      console.warn(`Failed to parse ${file}:`, e);
    }
  }

  return allPrompts;
}

function getCategoryForPayload(name: string): string {
  if (name.includes("injection") || name.includes("inject")) return "prompt_injection";
  if (name.includes("xss") || name.includes("sql")) return "tool_argument_injection";
  if (name.includes("harmful")) return "prompt_injection";
  if (name.includes("encoded")) return "prompt_injection";
  if (name.includes("markdown")) return "prompt_injection";
  if (name.includes("python") || name.includes("shell") || name.includes("access")) return "tool_argument_injection";
  return "prompt_injection";
}

function getSeverityForPayload(name: string): "low" | "medium" | "high" | "critical" {
  if (name.includes("harmful") || name.includes("injection")) return "critical";
  if (name.includes("xss") || name.includes("sql") || name.includes("shell")) return "critical";
  if (name.includes("encoded")) return "high";
  return "medium";
}

function getAtlasTechniqueForPayload(name: string): string {
  if (name.includes("injection") || name.includes("inject")) return "AML.T0051.000";
  if (name.includes("xss") || name.includes("sql")) return "AML.T0043";
  return "AML.T0051.000";
}

/**
 * Import all Garak data
 */
export function importAllGarakData(options: GarakImportOptions = {}) {
  console.log("=" .repeat(70));
  console.log("GARAK DATA IMPORTER");
  console.log("=" .repeat(70));

  const wildJailbreaks = importDanInTheWild(options);
  const danVariants = importDanVariants(options);
  const payloads = importPayloads(options);

  const allAttacks = [...wildJailbreaks, ...danVariants, ...payloads];

  console.log("\n" + "=" .repeat(70));
  console.log(`IMPORT COMPLETE: ${allAttacks.length} total attacks`);
  console.log(`  - DanInTheWild: ${wildJailbreaks.length}`);
  console.log(`  - DAN Variants: ${danVariants.length}`);
  console.log(`  - Other Payloads: ${payloads.length}`);
  console.log("=" .repeat(70));

  return {
    wildJailbreaks,
    danVariants,
    payloads,
    allAttacks,
  };
}

/**
 * Generate TypeScript file from imported data
 */
export function generateTypeScriptFile(attacks: any[], outputPath: string) {
  const tsContent = `/**
 * Garak Imported Payloads
 *
 * Auto-generated from Garak framework data.
 * DO NOT EDIT - this file is generated by garak-importer.ts
 *
 * Generated: ${new Date().toISOString()}
 * Total attacks: ${attacks.length}
 */

import type { AttackPrompt } from "./types.js";

export const GARAK_IMPORTED_PAYLOADS: AttackPrompt[] = ${JSON.stringify(attacks, null, 2)};

export function getAllGarakPayloads(): AttackPrompt[] {
  return [...GARAK_IMPORTED_PAYLOADS];
}
`;

  fs.writeFileSync(outputPath, tsContent);
  console.log(`\nGenerated: ${outputPath}`);
}

/**
 * Main function - run this to import
 */
export function main() {
  const garakPath = process.env.GARAK_PATH || DEFAULT_GARAK_PATH;
  const outputPath = path.join(
    __dirname,
    "garak-imported-payloads.ts"
  );

  const { allAttacks } = importAllGarakData({ garakPath });
  generateTypeScriptFile(allAttacks, outputPath);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
