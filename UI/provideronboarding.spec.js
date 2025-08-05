import { test, expect } from '@playwright/test';
import Logger from '../utils/logger.js';

export default async function () {
  // Your Playwright script
  Logger.info("Running provider onboarding...");
}

// =========================
// Utility Functions
// =========================

// Generates a random email for patient registration
function randomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  for (let i = 0; i < 8; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${name}${Math.floor(Math.random() * 10000)}@thinkitive.com`;
}

// =========================
// Auth Helpers
// =========================

/**
 * Logs in to the application using the provided page instance.
 */
async function login(page) {
  Logger.info('Navigating to login page');
  await page.goto('https://stage_aithinkitive.uat.provider.ecarehealth.com/');
  await page.goto('https://stage_aithinkitive.uat.provider.ecarehealth.com/auth/login');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill('RubyVOlague@jourrapide.com');
  await page.getByPlaceholder('Email').press('Tab');
  await page.locator('input[type="password"]').fill('Pass@123');
  await page.getByRole('button', { name: "Let's get Started" }).click();
  Logger.info('Logged in successfully');
}

/**
 * Logs out of the application using the provided page instance.
 */
async function logout(page) {
  Logger.info('Logging out');
  await page.getByRole('img', { name: 'admin image' }).click();
  await page.getByText('Log Out').click();
  await page.getByRole('button', { name: 'Yes,Sure' }).click();
  Logger.info('Logged out successfully');
}

// =========================
// Test 1: Patient Registration
// =========================
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Sample realistic names
const firstNames = ['Ava', 'Liam', 'Mia', 'Noah', 'Emma', 'Elijah', 'Sophia', 'James', 'Olivia', 'Lucas'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Garcia', 'Miller', 'Wilson', 'Moore', 'Taylor'];

test('Add Provider User', async ({ page }) => {
    Logger.info('Starting adding provider');
    await login(page);
    // Step 4: Navigate to Settings → User Settings → Providers
    //Logger.log('⚙️ Step 4: Navigating to Provider settings...');
    await page.locator('a:has-text("Settings"), button:has-text("Settings"), [data-testid*="settings"]')
      .first()
      .click();
    await page.waitForTimeout(1000);

    await page.getByText('User Settings', { exact: true }).click();
    await page.waitForTimeout(1000);

    await page.getByText('Providers', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    Logger.info('✅ Successfully navigated to Providers section');

    // Step 5: Click "Add Provider User"
    await page.getByRole('button', { name: 'Add Provider User' }).click();
    await page.waitForTimeout(2000);
    Logger.info('✅ Add Provider form opened');

    // Step 6: Fill form
    Logger.info('📝 Step 6: Filling form...');
    await page.locator('input[name="firstName"], input[placeholder*="First Name" i]')
      .fill("Rohini");
    await page.locator('input[name="lastName"], input[placeholder*="Last Name" i]')
      .fill("olive");

    await page.locator('input[name="role"][role="combobox"]').click();
    await page.waitForTimeout(500);
    await page.getByText('Provider', { exact: true }).click();
    Logger.info('✅ Provider role selected');

    await page.locator('input[name="gender"][role="combobox"]').click();
    await page.waitForTimeout(500);
    await page.getByText('Male', { exact: true }).click();
    Logger.info('✅ Gender selected: Male');

    await page.locator('input[name="email"], input[type="email"]').fill("rohini@mailinator.com");
    Logger.info('✅ Email entered:');

    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    Logger.info('💾 Save button clicked successfully');

  
});