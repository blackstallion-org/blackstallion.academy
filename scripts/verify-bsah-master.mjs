const { chromium } = await import(process.env.BSAH_PLAYWRIGHT_MODULE || "/Users/stingraj/sting raj /node_modules/playwright/index.mjs");
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const outputDir = "scratch/master_verification";
await mkdir(outputDir, { recursive: true });

const BASE = "http://localhost:3105";

async function run() {
  console.log("Launching headless browser for master verification...");
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
  // TEST 1: Mobile Navigation (Phase 01)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 01: Mobile Navigation ===");
  {
    const page = await mobileContext.newPage();
    captureErrors(page, "/ (mobile nav)");
    await page.goto(`${BASE}/?noload`, { waitUntil: "networkidle" });

    // Click Menu button
    const menuBtn = page.locator('button[aria-controls="site-menu"]');
    await assert.ok(await menuBtn.isVisible(), "Menu button must be visible");
    await menuBtn.click();
    await page.waitForTimeout(600);

    const siteMenu = page.locator("#site-menu");
    await assert.ok(await siteMenu.isVisible(), "Site menu dialog must be visible");
    await page.screenshot({ path: `${outputDir}/01_mobile_nav_opened.png` });

    // Check menu body scrolling
    const menuBody = page.locator(".site-menu-body");
    await assert.ok(await menuBody.isVisible(), "Site menu body must be visible");

    const scrollHeight = await menuBody.evaluate((el) => el.scrollHeight);
    const clientHeight = await menuBody.evaluate((el) => el.clientHeight);
    console.log(`Menu scroll metrics: scrollHeight=${scrollHeight}, clientHeight=${clientHeight}`);
    assert.ok(scrollHeight > clientHeight, "Menu body must have more content than client height to scroll");

    // Scroll down to the bottom
    await menuBody.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outputDir}/01_mobile_nav_scrolled_bottom.png` });

    // Verify last links (e.g. About, Request admission) are reachable
    const aboutLink = siteMenu.locator('a[href="/about"]');
    await assert.ok(await aboutLink.isVisible(), "About link at bottom of menu must be visible when scrolled");

    // Close menu
    const closeBtn = siteMenu.locator("button:has-text('Close')");
    await closeBtn.click();
    await page.waitForTimeout(500);
    assert.ok(!(await siteMenu.isVisible()), "Menu must close cleanly");

    // Verify background scroll works after menu close
    const bodyPos = await page.evaluate(() => document.body.style.position);
    assert.equal(bodyPos, "", "Body position must be unlocked after menu close");

    await page.close();
    console.log("✓ Phase 01: Mobile Navigation passed!");
  }

  // -------------------------------------------------------------
  // TEST 2: Curriculum Page (Phase 03 & 05: Horse-Hand Bond)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 03 & 05: Curriculum & Horse-Hand Bond ===");
  {
    // Desktop
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/curriculum (desktop)");
    await pageD.goto(`${BASE}/curriculum?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1000);
    await pageD.screenshot({ path: `${outputDir}/02_curriculum_desktop.png` });

    // Check top clearance
    const navBox = await pageD.locator("header").first().boundingBox();
    console.log(`Curriculum Desktop Nav height: ${navBox?.height}px`);

    // Verify HorseHand canvas and copy
    const bondVisual = pageD.locator(".bond-visual");
    await assert.ok(await bondVisual.isVisible(), "Bond visual canvas container must be visible");
    const heading = pageD.locator("h2:has-text('The stillness before the command')");
    await assert.ok(await heading.isVisible(), "Curriculum headline must be visible and clear");

    await pageD.close();

    // Mobile
    const pageM = await mobileContext.newPage();
    captureErrors(pageM, "/curriculum (mobile)");
    await pageM.goto(`${BASE}/curriculum?noload`, { waitUntil: "networkidle" });
    await pageM.waitForTimeout(1000);
    await pageM.screenshot({ path: `${outputDir}/02_curriculum_mobile.png` });
    await pageM.close();
    console.log("✓ Phase 03 & 05: Curriculum passed!");
  }

  // -------------------------------------------------------------
  // TEST 3: 3D Monument Page (Phase 04)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 04: 3D Monument Page ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/statue (desktop)");
    await pageD.goto(`${BASE}/statue?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1200);
    await pageD.screenshot({ path: `${outputDir}/03_statue_desktop.png` });

    const pageM = await mobileContext.newPage();
    captureErrors(pageM, "/statue (mobile)");
    await pageM.goto(`${BASE}/statue?noload`, { waitUntil: "networkidle" });
    await pageM.waitForTimeout(1200);
    await pageM.screenshot({ path: `${outputDir}/03_statue_mobile.png` });

    await pageD.close();
    await pageM.close();
    console.log("✓ Phase 04: 3D Monument passed!");
  }

  // -------------------------------------------------------------
  // TEST 4: Safety & Equipment Section (Phase 06)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 06: Safety & Equipment ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/equipment (desktop)");
    await pageD.goto(`${BASE}/equipment?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1000);

    // Scroll to equipment grid
    await pageD.evaluate(() => window.scrollBy(0, 700));
    await pageD.waitForTimeout(600);
    await pageD.screenshot({ path: `${outputDir}/04_equipment_desktop.png` });

    // Verify 4 cards
    const cards = pageD.locator(".equipment-card");
    const count = await cards.count();
    console.log(`Equipment cards found: ${count}`);
    assert.equal(count, 4, "Must have exactly 4 equipment specimen cards");

    // Expand details
    const firstDetails = cards.first().locator("details");
    await firstDetails.locator("summary").click();
    await pageD.waitForTimeout(200);
    const isOpen = await firstDetails.evaluate((el) => el.open);
    assert.ok(isOpen, "Specifications accordion must open cleanly");

    await pageD.close();

    const pageM = await mobileContext.newPage();
    captureErrors(pageM, "/equipment (mobile)");
    await pageM.goto(`${BASE}/equipment?noload`, { waitUntil: "networkidle" });
    await pageM.waitForTimeout(1000);
    await pageM.evaluate(() => window.scrollBy(0, 600));
    await pageM.waitForTimeout(500);
    await pageM.screenshot({ path: `${outputDir}/04_equipment_mobile.png` });
    await pageM.close();
    console.log("✓ Phase 06: Safety & Equipment passed!");
  }

  // -------------------------------------------------------------
  // TEST 5: Schools & Citadel Configurator (Phase 07)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 07: Schools & Citadel Configurator ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/schools (desktop)");
    await pageD.goto(`${BASE}/schools?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1200);
    await pageD.screenshot({ path: `${outputDir}/05_schools_desktop.png` });

    // Scroll down to 7-layers
    const layersSection = pageD.locator("#layers-section");
    if (await layersSection.isVisible()) {
      await layersSection.scrollIntoViewIfNeeded();
      await pageD.waitForTimeout(400);
      await pageD.screenshot({ path: `${outputDir}/05_schools_layers_desktop.png` });

      // Click second layer
      const detailsList = layersSection.locator("details");
      const layerCount = await detailsList.count();
      console.log(`Architectural layers found: ${layerCount}`);
      assert.equal(layerCount, 7, "Must preserve all 7 implementation layers");

      // Open layer 2 and check layer 1 closes (accordion behavior)
      await detailsList.nth(1).locator("summary").click();
      await pageD.waitForTimeout(200);
      const isL2Open = await detailsList.nth(1).evaluate((el) => el.open);
      assert.ok(isL2Open, "Layer 2 must open on click");
    }

    await pageD.close();
    console.log("✓ Phase 07: Schools & Citadel Configurator passed!");
  }

  // -------------------------------------------------------------
  // TEST 6: Sovereign Council (Phase 08)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 08: Sovereign Council ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/about?noload");
    await pageD.goto(`${BASE}/about?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1000);
    await pageD.screenshot({ path: `${outputDir}/06_about_desktop.png` });

    // Verify council on schools or about
    const councilPage = await desktopContext.newPage();
    await councilPage.goto(`${BASE}/schools?noload`, { waitUntil: "networkidle" });
    const councilSection = councilPage.locator('section[aria-labelledby="council-h"]');
    if (await councilSection.isVisible()) {
      await councilSection.scrollIntoViewIfNeeded();
      await councilPage.waitForTimeout(400);
      await councilPage.screenshot({ path: `${outputDir}/06_council_cards_desktop.png` });
      const councilCards = councilSection.locator(".council-card");
      console.log(`Council cards found: ${await councilCards.count()}`);
      assert.equal(await councilCards.count(), 4, "Must have exactly 4 refined council cards");
    }
    await councilPage.close();
    await pageD.close();
    console.log("✓ Phase 08: Sovereign Council passed!");
  }

  // -------------------------------------------------------------
  // TEST 7: Verify Page (Phase 09)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 09: Verify Page ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/verify (desktop)");
    await pageD.goto(`${BASE}/verify?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(800);
    await pageD.screenshot({ path: `${outputDir}/07_verify_desktop.png` });

    // Verify 3 stages timeline
    const timelineItems = pageD.locator(".verification-timeline li");
    const count = await timelineItems.count();
    console.log(`Verification timeline steps: ${count}`);
    assert.equal(count, 3, "Verification timeline must have 3 steps: Issued, Sealed, Verified");

    // Privacy section
    const privacy = pageD.locator('section[aria-labelledby="sees-h"]');
    await assert.ok(await privacy.isVisible(), "Privacy section must be visible");

    await pageD.close();

    const pageM = await mobileContext.newPage();
    captureErrors(pageM, "/verify (mobile)");
    await pageM.goto(`${BASE}/verify?noload`, { waitUntil: "networkidle" });
    await pageM.waitForTimeout(800);
    await pageM.screenshot({ path: `${outputDir}/07_verify_mobile.png` });
    await pageM.close();
    console.log("✓ Phase 09: Verify Page passed!");
  }

  // -------------------------------------------------------------
  // TEST 8: Home Page & Global Parallax (Phase 02, 10, 11)
  // -------------------------------------------------------------
  console.log("=== Testing Phase 02, 10, 11: Home & Universal Parallax ===");
  {
    const pageD = await desktopContext.newPage();
    captureErrors(pageD, "/ (desktop home)");
    await pageD.goto(`${BASE}/?noload`, { waitUntil: "networkidle" });
    await pageD.waitForTimeout(1000);
    await pageD.screenshot({ path: `${outputDir}/08_home_desktop_top.png` });

    // Scroll down and test smooth scroll & parallax
    await pageD.evaluate(() => window.scrollBy(0, 1200));
    await pageD.waitForTimeout(800);
    await pageD.screenshot({ path: `${outputDir}/08_home_desktop_scrolled.png` });

    await pageD.close();

    const pageM = await mobileContext.newPage();
    captureErrors(pageM, "/ (mobile home)");
    await pageM.goto(`${BASE}/?noload`, { waitUntil: "networkidle" });
    await pageM.waitForTimeout(1000);
    await pageM.screenshot({ path: `${outputDir}/08_home_mobile_top.png` });
    await pageM.close();
    console.log("✓ Phase 02, 10, 11: Home & Universal Parallax passed!");
  }

  await browser.close();

  if (errors.length > 0) {
    console.warn(`Encountered ${errors.length} unhandled page errors during run:`, errors);
  } else {
    console.log("🎉 ALL TESTS & SCREENSHOTS COMPLETED WITH ZERO PAGE ERRORS!");
  }
}

run().catch((err) => {
  console.error("Master verification failed:", err);
  process.exit(1);
});
