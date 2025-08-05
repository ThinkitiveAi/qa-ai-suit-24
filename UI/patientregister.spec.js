import { test, expect } from '@playwright/test';
import Logger from '../utils/logger.js';

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
  await page.goto('https://stage_ketamin.uat.provider.ecarehealth.com/');
  await page.goto('https://stage_ketamin.uat.provider.ecarehealth.com/auth/login');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill('amol.shete+TP@medarch.com');
  await page.getByPlaceholder('Email').press('Tab');
  await page.locator('input[type="password"]').fill('Test@123$');
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

test.describe('Patient Registration - Mandatory Fields', () => {
  test('should successfully register a new patient with mandatory fields', async ({ page }) => {
    Logger.info('Starting patient registration test');

    await login(page);

    await page.waitForURL('**/scheduling/appointment');
    Logger.info('Dashboard loaded');

    await page.locator('div').filter({ hasText: /^Create$/ }).nth(1).click();
    Logger.info('Clicked Create');

    await page.getByRole('menuitem', { name: 'New Patient' }).click();
    Logger.info('Selected New Patient');

    await page.locator('div').filter({ hasText: /^Enter Patient Details$/ }).click();
    Logger.info('Selected Enter Patient Details');

    await page.getByRole('button', { name: 'Next' }).click();
    Logger.info('Proceeded to patient details form');

    await page.getByRole('textbox', { name: 'First Name *' }).fill('Shubhangi');
    await page.getByRole('textbox', { name: 'Last Name *' }).fill('Gade');
    await page.getByRole('textbox', { name: 'Date Of Birth *' }).fill('01-01-1999');

    await page.locator('form').filter({ hasText: 'Gender *Gender *' }).getByLabel('Open').click();
    await page.getByRole('option', { name: 'Female' }).click();

    await page.getByRole('textbox', { name: 'Mobile Number *' }).fill('9876544400');
    const email = randomEmail();
    await page.getByRole('textbox', { name: 'Email *' }).fill(email);
    Logger.info(`Filled patient details with email: ${email}`);

    await page.getByRole('button', { name: 'Save' }).click();
    Logger.info('Clicked Save');

    await expect(page.locator('text=Patient Details Added Successfully')).toBeVisible();
    Logger.info('Verified patient creation success message');

    await page.waitForURL('**/patients');
    await expect(page.getByRole('tab', { name: 'Patients', selected: true })).toBeVisible();
    Logger.info('Verified navigation to patients page');

    // Optional: logout if needed
    // await logout(page);
  });
});
