export type BiologyContext = {
  organism: "bacterial" | "eukaryotic" | "unspecified";
};

export function detectBiologyContext(prompt: string): BiologyContext {
  const text = prompt.toLowerCase();

  if (
    text.includes("bacteria") ||
    text.includes("bacterial") ||
    text.includes("prokaryote") ||
    text.includes("prokaryotic") ||
    /\bssb\b/.test(text) ||
    text.includes("e. coli") ||
    text.includes("e coli") ||
    text.includes("escherichia coli")
  ) {
    return { organism: "bacterial" };
  }

  if (
    text.includes("eukaryote") ||
    text.includes("eukaryotic") ||
    text.includes("human") ||
    text.includes("mammalian") ||
    text.includes("rna polymerase ii") ||
    text.includes("polymerase ii") ||
    /\bpol ii\b/.test(text) ||
    /\brpa\b/.test(text)
  ) {
    return { organism: "eukaryotic" };
  }

  return { organism: "unspecified" };
}
