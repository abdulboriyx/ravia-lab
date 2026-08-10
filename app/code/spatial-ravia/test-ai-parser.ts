import { parseBiologyPromptWithAI } from "./biology-ai-parser";

async function main() {
  const prompts = [
    "show helicase opening DNA",
    "what stops the two DNA strands from joining again?",
    "where does topoisomerase work relative to helicase?",
    "show how primase helps during DNA replication",
  ];

  for (const prompt of prompts) {
    console.log("\nPROMPT:", prompt);

    try {
      const result = await parseBiologyPromptWithAI(prompt);
      console.dir(result, { depth: null });
    } catch (error) {
      console.error("FAILED:", error);
    }
  }
}

main();