export type BiologyContext = {
  organism: "bacterial" | "eukaryotic" | "unspecified";
};

export function detectBiologyContext(prompt: string): BiologyContext {
  const text = prompt.toLowerCase();

  if (
    text.includes("bacteria") ||
    text.includes("bacterial") ||
    text.includes("prokaryote") ||
    text.includes("prokaryotic")
  ) {
    return { organism: "bacterial" };
  }

  if (
    text.includes("eukaryote") ||
    text.includes("eukaryotic") ||
    text.includes("human") ||
    text.includes("mammalian")
  ) {
    return { organism: "eukaryotic" };
  }

  return { organism: "unspecified" };
}
