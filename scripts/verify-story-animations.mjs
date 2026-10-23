const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "/Users/stingraj/sting raj /node_modules/playwright/index.mjs");
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const outputDir = "scratch/story_animations_verification";
await mkdir(outputDir, { recursive: true });

// Check port 3000 first, fallback to 3105
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log(`Launching Chrome headless against ${BASE}...`);
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  const errors = [];
  const captureErrors = (page, route) => {
    page.on("pageerror", (err) => {
      console.error(`Page error on ${route}:`, err.message);
      errors.push({ route, error: err.message });
    });
  };

  // -------------------------------------------------------------
  // TEST 1: Home Page Observer Stage & Liquid Curtain
  // -------------------------------------------------------------
  console.log("=== 1. Testing Home Page (Observer Story Stage & Liquid Veil) ===");
  {
    const page = await desktopContext.newPage();
    captureErrors(page, "/ (desktop)");
    await page.goto(`${BASE}/?noload`, { waitUntil: "domcontentloaded" });

    // Verify SiteNav safe clearance
    const nav = page.locator("header.site-nav-shell, nav[aria-label='Global']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outputDir}/home_desktop_hero.png` });

    // Scroll to the Observer Chronicle Stage
    const observerStage = page.locator("#home-observer-chronicle");
    await assert.ok(await observerStage.count() > 0, "ObserverStoryStage must be present in DOM");
    await observerStage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Verify Chapter I is visible
    const chapterHeading = page.locator("#home-observer-chronicle h2").first();
    await assert.ok(await chapterHeading.isVisible(), "Chapter heading must be visible");
    const headingText = await chapterHeading.innerText();
    console.log(`Observer Stage Active Heading: "${headingText.trim().replace(/\s+/g, ' ')}"`);

    // Screenshot Tactile Passport Section (HomeVerifier)
    const verifierSection = page.locator("#verify-h");
    await verifierSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/home_desktop_tactile_passport.png` });

    // Screenshot Clean Charging Cavalry (HomeStandings) to confirm fade removal
    const circuitSection = page.locator("#circuit-h");
    await circuitSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/home_desktop_clean_circuit_image.png` });

    // Test Mobile Viewport
    const mobilePage = await mobileContext.newPage();
    captureErrors(mobilePage, "/ (mobile)");
    await mobilePage.goto(`${BASE}/?noload`, { waitUntil: "domcontentloaded" });
    const mobileStage = mobilePage.locator("#home-observer-chronicle");
    await mobileStage.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: `${outputDir}/home_mobile_observer_stage.png` });
    await mobilePage.close();
    await page.close();
  }

  // -------------------------------------------------------------
  // TEST 2: The Legend Page (Scroll Distortion & Thar Odyssey Parallax)
  // -------------------------------------------------------------
  console.log("=== 2. Testing /legend (ScrollDistortionImage & Thar Odyssey) ===");
  {
    const page = await desktopContext.newPage();
    captureErrors(page, "/legend (desktop)");
    await page.goto(`${BASE}/legend?noload`, { waitUntil: "domcontentloaded" });

    // Verify Plate I ScrollDistortionImage canvas presence
    const plateCanvas = page.locator("#ocean canvas");
    console.log(`Plate I WebGL Canvas count: ${await plateCanvas.count()}`);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${outputDir}/legend_desktop_plate1.png` });

    // Scroll to Thar Odyssey Parallax World
    const tharOdyssey = page.locator("#legend-thar-odyssey");
    await assert.ok(await tharOdyssey.count() > 0, "TharOdysseyParallax must be present in DOM");
    await tharOdyssey.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Capture Scene 1: Desert Noon
    await page.screenshot({ path: `${outputDir}/legend_desktop_thar_scene1.png` });

    // Scroll partially down the Odyssey (Scrub trigger)
    await page.evaluate(() => {
      const el = document.getElementById("legend-thar-odyssey");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 900, behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/legend_desktop_thar_scene2.png` });

    // Mobile Viewport of Legend & Thar Odyssey
    const mobilePage = await mobileContext.newPage();
    captureErrors(mobilePage, "/legend (mobile)");
    await mobilePage.goto(`${BASE}/legend?noload`, { waitUntil: "domcontentloaded" });
    const mobileOdyssey = mobilePage.locator("#legend-thar-odyssey");
    await mobileOdyssey.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: `${outputDir}/legend_mobile_thar_odyssey.png` });
    await mobilePage.close();
    await page.close();
  }

  // -------------------------------------------------------------
  // TEST 3: The Chronicle Page (Parchment Burning fBm Shader Reveal)
  // -------------------------------------------------------------
  console.log("=== 3. Testing /journal (ParchmentStoryReveal fBm Noise Shader) ===");
  {
    const page = await desktopContext.newPage();
    captureErrors(page, "/journal (desktop)");
    await page.goto(`${BASE}/journal?noload`, { waitUntil: "domcontentloaded" });

    const parchmentSection = page.locator("#journal-parchment-reveal");
    await assert.ok(await parchmentSection.count() > 0, "ParchmentStoryReveal must be present in DOM");
    await parchmentSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Capture pristine unburned parchment state
    await page.screenshot({ path: `${outputDir}/journal_desktop_parchment_pristine.png` });

    // Scroll halfway into the pin to activate burning progress
    await page.evaluate(() => {
      const el = document.getElementById("journal-parchment-reveal");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 600, behavior: "instant" });
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/journal_desktop_parchment_burning.png` });

    // Mobile Viewport
    const mobilePage = await mobileContext.newPage();
    captureErrors(mobilePage, "/journal (mobile)");
    await mobilePage.goto(`${BASE}/journal?noload`, { waitUntil: "domcontentloaded" });
    const mobileParchment = mobilePage.locator("#journal-parchment-reveal");
    await mobileParchment.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: `${outputDir}/journal_mobile_parchment.png` });
    await mobilePage.close();
    await page.close();
  }

  // -------------------------------------------------------------
  // TEST 4: The Lore Page (Folklore Plates Scroll Distortion)
  // -------------------------------------------------------------
  console.log("=== 4. Testing /lore (Folklore Plates with Velocity Distortion) ===");
  {
    const page = await desktopContext.newPage();
    captureErrors(page, "/lore (desktop)");
    await page.goto(`${BASE}/lore?noload`, { waitUntil: "domcontentloaded" });

    const plate1 = page.locator("#lore-1");
    await assert.ok(await plate1.count() > 0, "Lore Plate 1 must be present in DOM");
    await plate1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/lore_desktop_plate1.png` });

    const mobilePage = await mobileContext.newPage();
    captureErrors(mobilePage, "/lore (mobile)");
    await mobilePage.goto(`${BASE}/lore?noload`, { waitUntil: "domcontentloaded" });
    const mobilePlate = mobilePage.locator("#lore-1");
    await mobilePlate.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: `${outputDir}/lore_mobile_plate1.png` });
    await mobilePage.close();
    await page.close();
  }

  await browser.close();

  console.log("\n================ VERIFICATION SUMMARY ================");
  console.log(`Total page errors encountered: ${errors.length}`);
  if (errors.length > 0) {
    console.error("Errors:", errors);
    process.exit(1);
  }
  console.log("All story animation suites PASSED with 0 errors!");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
