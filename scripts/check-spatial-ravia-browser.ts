import { chromium } from "playwright";

const prompts: Array<[string, "molstar" | "three" | "unsupported"]> = [
  ["show how an action potential works", "three"],
  ["show resting membrane potential", "three"],
  ["show what happens at threshold", "three"],
  ["show depolarization", "three"],
  ["show sodium entering through voltage-gated sodium channels", "three"],
  ["show what happens at the peak", "three"],
  ["show repolarization", "three"],
  ["show potassium leaving during repolarization", "three"],
  ["show hyperpolarization", "three"],
  ["show recovery after an action potential", "three"],
  ["show why depolarization accelerates", "three"],
  ["show why the neuron cannot immediately fire again", "three"],
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
  const promptInput = page.getByRole("textbox", {
    name: "Spatial Ravia prompt",
  });

  await promptInput.waitFor();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "SPATIAL_RAVIA_UI_EXPANDED.png",
    caret: "initial",
  });

  const promptInputs = await promptInput.count();
  const dockBox = await page.locator(".spatialPromptDock").boundingBox();
  const oldPromptCount = await page
    .getByPlaceholder("Describe what you want to see...")
    .count();

  if (promptInputs !== 1) {
    errors.push(`expected one prompt input, found ${promptInputs}`);
  }

  if (oldPromptCount !== 0) {
    errors.push(`old prompt input is still present: ${oldPromptCount}`);
  }

  if (!dockBox || dockBox.y < 720) {
    errors.push(`prompt dock is not bottom positioned: ${JSON.stringify(dockBox)}`);
  }

  await promptInput.fill("show helicase opening DNA");
  await page.getByLabel("Collapse Spatial Ravia prompt").click();
  await page.screenshot({
    path: "SPATIAL_RAVIA_UI_COLLAPSED.png",
    caret: "initial",
  });
  await page.getByLabel("Open Spatial Ravia prompt").click();
  await page.waitForTimeout(100);
  const preservedPrompt = await promptInput.inputValue();
  const activeLabel = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label")
  );

  if (preservedPrompt !== "show helicase opening DNA") {
    errors.push(`prompt text was not preserved: ${preservedPrompt}`);
  }

  if (activeLabel !== "Spatial Ravia prompt") {
    errors.push(`prompt was not focused after expansion: ${activeLabel}`);
  }

  await page.keyboard.press("Escape");
  await page.getByLabel("Open Spatial Ravia prompt").waitFor();
  await page.keyboard.press("/");
  await promptInput.waitFor();
  const slashFocusLabel = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label")
  );

  if (slashFocusLabel !== "Spatial Ravia prompt") {
    errors.push(`slash shortcut did not focus prompt: ${slashFocusLabel}`);
  }

  await promptInput.fill("show helicase opening DNA");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "SPATIAL_RAVIA_UI_THREE.png", caret: "initial" });

  async function setTimelineTime(normalizedTime: number) {
    const range = page.getByRole("slider", { name: "Mechanism time" });
    await range.waitFor({ timeout: 5000 });
    await range.evaluate((element, value) => {
      const input = element as HTMLInputElement;
      const max = Number(input.max);
      input.value = String(Math.round(max * Number(value)));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, normalizedTime);
    await page.waitForTimeout(300);
  }

  await promptInput.fill("show RNA polymerase transcribing a gene");
  await page.getByRole("button", { name: "Generate" }).click();
  await page.getByLabel("Mechanism timeline").waitFor({ timeout: 5000 });
  await setTimelineTime(0);
  await page.screenshot({
    path: "SPATIAL_RAVIA_MOTION_TRANSCRIPTION_INITIATION.png",
    caret: "initial",
  });
  await setTimelineTime(0.55);
  await page.screenshot({
    path: "SPATIAL_RAVIA_MOTION_TRANSCRIPTION_ELONGATION.png",
    caret: "initial",
  });
  await page.getByLabel("Play mechanism").click();
  await page.waitForTimeout(600);
  await page.getByLabel("Pause mechanism").click();
  await page.getByLabel("Playback speed").selectOption("2");
  await page.getByLabel("Restart mechanism").click();
  await page.waitForTimeout(300);
  await page.getByLabel("Pause mechanism").click();
  await setTimelineTime(1);
  await page.screenshot({
    path: "SPATIAL_RAVIA_MOTION_TRANSCRIPTION_TERMINATION.png",
    caret: "initial",
  });

  await promptInput.fill("show how an action potential works");
  await page.getByRole("button", { name: "Generate" }).click();
  await page.getByLabel("Mechanism timeline").waitFor({ timeout: 5000 });
  await setTimelineTime(0.4);
  await page.screenshot({
    path: "SPATIAL_RAVIA_MOTION_ACTION_POTENTIAL.png",
    caret: "initial",
  });

  const results = [];

  for (const [prompt, expected] of prompts) {
    await promptInput.fill(prompt);
    await page.getByRole("button", { name: "Generate" }).click();
    await page.waitForTimeout(expected === "molstar" ? 2500 : 800);

    if (prompt === "show DNA") {
      await page
        .locator(".molstarLoadState")
        .waitFor({ state: "hidden", timeout: 8000 })
        .catch(() => undefined);
      const timelineCount = await page.getByLabel("Mechanism timeline").count();
      if (timelineCount !== 0) {
        errors.push(`Molstar DNA view unexpectedly showed timeline: ${timelineCount}`);
      }
      await page.screenshot({
        path: "SPATIAL_RAVIA_UI_MOLSTAR.png",
        caret: "initial",
      });
    }

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

  await page.setViewportSize({ width: 390, height: 760 });
  await promptInput.fill("show a ribosome elongating a protein");
  await page.getByRole("button", { name: "Generate" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: "SPATIAL_RAVIA_UI_MOBILE.png",
    caret: "initial",
  });

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
