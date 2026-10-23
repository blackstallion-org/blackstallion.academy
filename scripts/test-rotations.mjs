import fs from "node:fs";
import { chromium } from "/Users/stingraj/sting raj /node_modules/playwright/index.mjs";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // We can inject code or test routes
  await browser.close();
}
run();
