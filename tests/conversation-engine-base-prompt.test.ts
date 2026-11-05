import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildBaseSystemPrompt, type ResolvedBasePromptContext } from "../lib/conversation-engine/base-prompt.ts";

const source = readFileSync("app/api/chat/route.ts", "utf8");
const extracted = readFileSync("lib/conversation-engine/base-prompt.ts", "utf8");
const productionMatch = source.match(/const baseSystemPrompt = `([\s\S]*?)`\.trim\(\);/);
const sharedMatch = extracted.match(/return `([\s\S]*?)`\.trim\(\);/);
const mapping: Record<string, string> = {
  "pendingRelationshipGuide(rootState)": "pendingRelationshipGuide",
  "createRelationshipTimeGuide(relationshipTimeContext)": "relationshipTimeGuide",
  "createRelationshipSignalGuide()": "relationshipSignalGuide",
};

test("full production base prompt template matches extracted builder byte-for-byte", () => {
  assert.ok(productionMatch, "production template not found");
  assert.ok(sharedMatch, "shared template not found");
  const normalized = sharedMatch[1].replace(/\$\{context\.([a-zA-Z]+)\}/g, (_whole, name: string) => {
    const original = Object.entries(mapping).find(([, value]) => value === name)?.[0] ?? name;
    return "${" + original + "}";
  });
  assert.equal(normalized, productionMatch[1]);
});

test("all resolved fields are included and whitespace trim is stable", () => {
  assert.ok(productionMatch);
  const fieldNames = [...productionMatch[1].matchAll(/\$\{([^}]+)\}/g)]
    .map((match) => mapping[match[1]] ?? match[1]);
  const context = Object.fromEntries(fieldNames.map((name) => [name, "MARKER_" + name])) as ResolvedBasePromptContext;
  const result = buildBaseSystemPrompt(context);
  for (const name of fieldNames) assert.ok(result.includes("MARKER_" + name), name);
  assert.ok(result.startsWith("MARKER_personaPrompt"));
  assert.ok(result.endsWith("}"));
  assert.equal(result, result.trim());
});
