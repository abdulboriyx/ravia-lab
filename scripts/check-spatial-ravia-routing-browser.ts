import { chromium } from "playwright";

const cases = [
  { prompt: "show A-T base pairing", expected: { domain: "DNA", owner: "DnaBasePairInteractionPresentation" }, forbidden: ["RnaPairingPresentation"] },
  { prompt: "show phosphodiester bond in DNA", expected: { domain: "DNA", owner: "DnaBackboneChemistryPresentation" }, forbidden: ["RnaLocalChemistryPresentation"] },
  { prompt: "show phosphodiester bond in RNA", expected: { domain: "RNA", owner: "RnaLocalChemistryPresentation" }, forbidden: ["DnaBackboneChemistryPresentation"] },
  { prompt: "show bacterial transcription", expected: { domain: "CELLULAR", identity: "BACTERIAL_RNAP" }, forbidden: ["EUKARYOTIC_POL_II_SOURCE_UNAVAILABLE"] },
  { prompt: "show eukaryotic RNA polymerase II transcribing DNA", expected: { domain: "CELLULAR", identity: "EUKARYOTIC_POL_II", failure: "EUKARYOTIC_POL_II_SOURCE_UNAVAILABLE" }, forbidden: [] },
] as const;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await page.goto("http://localhost:3000/code/spatial-ravia", { waitUntil: "domcontentloaded" });
  const prompt = page.getByRole("textbox", { name: "Scina prompt" });
  await prompt.waitFor();

  for (const item of cases) {
    await prompt.fill(item.prompt);
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Generate" }).click();
    await page.waitForTimeout(800);
    const main = page.locator("main");
    const visible = await main.innerText();
    const attrs = {
      domain: await main.getAttribute("data-scina-domain"),
      identity: await main.getAttribute("data-scina-identity"),
      owner: await main.getAttribute("data-scina-owner"),
    };
    for (const [key, expected] of Object.entries(item.expected)) {
      if (key === "failure" ? !visible.includes(expected) : attrs[key as keyof typeof attrs] !== expected) throw new Error(`${item.prompt}: missing ${key} ${expected}; got ${JSON.stringify(attrs)}`);
    }
    for (const forbidden of item.forbidden) if (visible.includes(forbidden)) throw new Error(`${item.prompt}: forbidden competing identity ${forbidden}`);
  }

  if (errors.length) throw new Error(errors.join("\n"));
  await browser.close();
  console.log(`routing browser smoke passed (${cases.length} cases)`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
