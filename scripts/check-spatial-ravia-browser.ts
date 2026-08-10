import { chromium } from "playwright";

const prompts: Array<[string, "molstar" | "three" | "unsupported"]> = [
  ["show a membrane receptor", "three"],
  ["show a ligand binding a receptor tyrosine kinase", "three"],
  ["show receptor dimerization", "three"],
  ["show RTK autophosphorylation", "three"],
  ["show Grb2 binding to an activated receptor", "three"],
  ["show Ras activation downstream of RTK", "three"],
  ["show Ras switching from GDP to GTP", "three"],
  ["show the MAPK cascade", "three"],
  ["show RTK signaling through Ras Raf MEK ERK", "three"],
  ["show ERK signaling toward the nucleus", "three"],
  ["show a ribosome elongating a protein", "three"],
  ["show translation initiation", "three"],
  ["show codon anticodon pairing", "three"],
  ["show a charged tRNA entering the A site", "three"],
  ["show peptide bond formation", "three"],
  ["show ribosome translocation", "three"],
  ["show tRNA moving through A P and E sites", "three"],
  ["show translation from 5 prime to 3 prime", "three"],
  ["show translation termination", "three"],
  ["show a release factor at a stop codon", "three"],
  ["show DNA", "molstar"],
  ["show RNA polymerase transcribing a gene", "three"],
  ["show the enzyme making RNA from DNA", "three"],
  ["show the transcription bubble", "three"],
  ["show template and coding DNA strands", "three"],
  ["show RNA synthesis from 5 prime to 3 prime", "three"],
  ["show bacterial transcription", "three"],
  ["show RNA polymerase II transcribing a human gene", "three"],
  ["show transcription termination", "three"],
  ["show the enzyme that separates the DNA strands", "three"],
  ["show helicase opening DNA", "three"],
  ["show polymerase synthesizing DNA", "three"],
  ["show lagging strand Okazaki fragments", "three"],
  ["display the motor protein pulling apart the parental duplex", "three"],
  ["what keeps human DNA strands apart?", "three"],
  ["visualize SSB on single-stranded DNA", "three"],
  ["what prevents the fork from creating too much torsional stress?", "three"],
  ["where does the short RNA starter piece originate?", "three"],
  ["show nucleotide addition to a growing daughter strand", "three"],
  ["show the strand made continuously toward the fork", "three"],
  ["show the short discontinuous DNA pieces made during replication", "three"],
  ["during replication, show what seals the gaps after primer replacement", "three"],
  ["which way does DNA polymerase add nucleotides?", "three"],
  ["show DNA doing its thing", "unsupported"],
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto("http://localhost:3000/code/spatial-ravia", {
    waitUntil: "domcontentloaded",
  });
  await page.getByPlaceholder("Describe what you want to see...").waitFor();

  const results = [];

  for (const [prompt, expected] of prompts) {
    await page.getByPlaceholder("Describe what you want to see...").fill(prompt);
    await page.getByRole("button", { name: "Generate" }).click();
    await page.waitForTimeout(expected === "molstar" ? 2500 : 800);

    const statusCount = await page.getByRole("status").count();
    const sourceText = await page
      .locator('[aria-label="Parser source"]')
      .textContent()
      .catch(() => "");
    const canvasCount = await page.locator("canvas").count();
    const bodyText = await page.locator("body").innerText();

    let nonblank: boolean | null = null;
    if (canvasCount > 0) {
      nonblank = await page.locator("canvas").first().evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return canvas.toDataURL("image/png").length > 5_000;
      });
    }

    const actual =
      statusCount > 0
        ? "unsupported"
        : sourceText?.includes("Parsed by") && canvasCount > 0
          ? expected === "molstar"
            ? "molstar"
            : "three"
          : "unknown";

    results.push({
      prompt,
      expected,
      actual,
      canvasCount,
      nonblank,
      sourceText,
      unsupportedVisible: statusCount > 0,
      unsupportedText: statusCount > 0 ? bodyText : "",
    });
  }

  await browser.close();

  const failures = results.filter((result) => {
    if (result.actual !== result.expected) {
      return true;
    }
    if (result.expected !== "unsupported" && result.nonblank !== true) {
      return true;
    }
    return false;
  });

  console.log(JSON.stringify({ results, errors, failures }, null, 2));

  if (errors.length > 0 || failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
