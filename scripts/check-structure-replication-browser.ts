import { chromium } from "playwright";

const baseUrl =
  process.env.SPATIAL_RAVIA_BASE_URL ?? "http://localhost:3000/code/spatial-ravia";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const promptInput = page.getByRole("textbox", { name: "Spatial Ravia prompt" });
  await promptInput.waitFor();

  async function generate(prompt: string) {
    await promptInput.fill(prompt);
    await page.getByRole("button", { name: "Generate" }).click();
    await page.waitForTimeout(900);
  }

  async function pressControl(label: string) {
    const button = page.getByLabel(label);
    await button.waitFor({ timeout: 5000 });
    await button.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
    await page.waitForTimeout(200);
  }

  async function pressAnyControl(labels: string[]) {
    for (const label of labels) {
      const button = page.getByLabel(label);
      if (await button.count()) {
        await button.first().evaluate((element) => {
          (element as HTMLButtonElement).click();
        });
        await page.waitForTimeout(200);
        return;
      }
    }
  }

  async function setTimelineTime(normalizedTime: number) {
    const range = page.getByRole("slider", { name: "Mechanism time" });
    await range.waitFor({ timeout: 5000 });
    await range.evaluate((element, normalized) => {
      const input = element as HTMLInputElement;
      const max = Number(input.max);
      const step = Number(input.step) || 1;
      const value = String(Math.round((max * Number(normalized)) / step) * step);
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, normalizedTime);
    await page.waitForTimeout(350);
  }

  async function assertNonblank(prompt: string) {
    const canvas = page.locator("canvas").first();
    await canvas.waitFor({ timeout: 5000 });
    const nonblank = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      return canvasElement.toDataURL("image/png").length > 5_000;
    });
    if (!nonblank) errors.push(`blank canvas for ${prompt}`);
  }

  await generate("show DNA replication");
  await page.getByLabel("Mechanism timeline").waitFor({ timeout: 5000 });
  await setTimelineTime(0.48);
  await assertNonblank("show DNA replication");
  await page.screenshot({ path: "STRUCTURE_REPLICATION_OVERVIEW.png", caret: "initial" });

  await pressControl("Restart mechanism");
  await pressAnyControl(["Play mechanism", "Pause mechanism"]);
  await page.waitForTimeout(500);
  await page.getByLabel("Playback speed").selectOption("2");
  await page.waitForTimeout(250);
  await page.getByLabel("Playback speed").selectOption("4");
  await page.waitForTimeout(250);
  if (await page.getByLabel("Pause mechanism").count()) {
    await pressControl("Pause mechanism");
  }
  await setTimelineTime(0.2);
  await setTimelineTime(0.8);

  const canvasBox = await page.locator("canvas").first().boundingBox();
  if (canvasBox) {
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.48, canvasBox.y + canvasBox.height * 0.52);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.66, canvasBox.y + canvasBox.height * 0.38, { steps: 8 });
    await page.mouse.up();
  }
  await page.screenshot({ path: "STRUCTURE_REPLICATION_ORBITED.png", caret: "initial" });

  for (const [prompt, path, time] of [
    ["show helicase opening DNA", "STRUCTURE_REPLICATION_HELICASE.png", 0.28],
    ["show leading strand synthesis", "STRUCTURE_REPLICATION_LEADING.png", 0.55],
    ["show lagging strand synthesis", "STRUCTURE_REPLICATION_LAGGING.png", 0.65],
    ["show how Okazaki fragments are made", "STRUCTURE_REPLICATION_OKAZAKI.png", 0.72],
    ["show ligase joining Okazaki fragments", "STRUCTURE_REPLICATION_LIGASE.png", 0.82],
  ] as const) {
    await generate(prompt);
    if (await page.getByLabel("Mechanism timeline").count()) {
      await setTimelineTime(time);
    }
    await assertNonblank(prompt);
    await page.screenshot({ path, caret: "initial" });
  }

  await generate("show DNA replication");
  await setTimelineTime(0.48);
  await page.screenshot({
    path: "STRUCTURE_REPLICATION_COMPARISON_STRUCTURE_GROUNDED.png",
    caret: "initial",
  });

  for (const prompt of [
    "show RNA polymerase transcribing a gene",
    "show a ribosome elongating a protein",
    "show RTK signaling through Ras Raf MEK ERK",
    "show how an action potential works",
  ]) {
    await generate(prompt);
    await assertNonblank(prompt);
  }

  await generate("show DNA");
  await page.waitForTimeout(2000);
  await assertNonblank("show DNA");

  await generate("show DNA doing its thing");
  const unsupportedVisible = await page.getByRole("status").count();
  if (unsupportedVisible === 0) {
    errors.push("unsupported fallback was not visible");
  }

  await browser.close();
  console.log(JSON.stringify({ errors }, null, 2));
  if (errors.length > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
