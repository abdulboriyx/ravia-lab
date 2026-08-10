export function normalizeBiologyPrompt(prompt: string): string {
  let text = prompt.toLowerCase().trim();

  const replacements: Array<[RegExp, string]> = [
    [/\bunzip\b/g, "unwind"],
    [/\bopen(ing)? the dna\b/g, "unwind dna"],
    [/\bopen(ing)? the duplex\b/g, "unwind dna"],
    [/\bhold(s|ing)? .* apart\b/g, "stabilize separated dna"],
    [/\bkeep(s|ing)? .* separate(d)?\b/g, "stabilize separated dna"],
    [/\bprevent(s|ing)? .* reanneal(ing)?\b/g, "stabilize separated dna"],
    [/\blay(s|ing)? down .* primer\b/g, "synthesize rna primer"],
    [/\bmake(s|ing)? .* primer\b/g, "synthesize rna primer"],
    [/\b5\s*['′` ]?\s*prime\b/g, "5-prime"],
    [/\b3\s*['′` ]?\s*prime\b/g, "3-prime"],
    [/\bjoin(s|ing)?\b/g, "ligates"],
    [/\bseal(s|ing)?\b/g, "ligates"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
}
