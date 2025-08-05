import { test, expect } from '@playwright/test';
import Logger from '../utils/logger.js';
import { text } from 'stream/consumers';

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
  await page.getByPlaceholder('Email').fill('rose.gomez@jourrapide.com');
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


test('Add Provider Availability with Random Values', async ({ page }) => {
    Logger.info('Starting to add provider availability');
    await login(page);
    
    // Navigate to Scheduling
    await page.getByRole('tab', { name: 'Scheduling' }).click();
    await page.getByText('Availability').click();
    Logger.info('✅ Successfully navigated to Availability section');
    await page.getByRole('button', { name: 'Edit Availability' }).click();
    Logger.info('✅ Edit Availability modal opened');
    
    const bookingWindows = ['1 Week', '2 Week', '3 Week', '4 Week'];
    const appointmentTypes = ['Care Coordination', 'New Patient Visit', 'Follow Up', 'Consultation'];
    const durations = ['15 minutes', '30 minutes', '45 minutes', '60 minutes'];
    const scheduleNotices = ['1 Hours Away', '2 Hours Away', '4 Hours Away', '24 Hours Away'];
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Fill Provider dropdown - Select "Rohini olive" (the newly added provider)
    await page.getByRole('combobox',{name : 'Select Provider'}).click();
    await page.getByRole('combobox', {name : 'Select Provider'}).fill("Rohini olive");
    await page.waitForSelector('text=Rohini olive');
    await page.locator('text=Rohini olive').click();
    Logger.info("selected provider for availability");

    
    // Select random Time Zone
    await page.getByRole('combobox', {name : 'Time Zone'}).click();
    await page.getByRole('combobox', {name : 'Time Zone'}).fill("Indian Standard Time (UTC +5:30)");
    await page.waitForSelector('text=Indian Standard Time (UTC +5:30)');
    await page.locator('text=Indian Standard Time (UTC +5:30)').click();
    Logger.info("selected timezone");
    
    // Select random weekday and add time slot
    function getRandomItem(array) {
       return array[Math.floor(Math.random() * array.length)];
    }

    // Your existing code
    const randomWeekday = getRandomItem(weekdays);
    await page.getByText(randomWeekday, { exact: true }).click();
    await page.waitForTimeout(500);
    Logger.info(`✅ Selected day: ${randomWeekday}`);

    //Select timeslots 


    const startTimeBox = page.getByRole('combobox', { name: 'Start Time' });

    // Check and clear existing value if any
    const currentStartTime = await startTimeBox.inputValue();
    if (currentStartTime) {
      await startTimeBox.fill(''); // clear the existing value
    }
    await startTimeBox.fill("10:00 AM");
    await page.locator('text=10:00 AM').click();
    Logger.info("Selected Start time");

// Handle End Time
const endTimeBox = page.getByRole('combobox', { name: 'End Time' });

const currentEndTime = await endTimeBox.inputValue();
if (currentEndTime) {
  await endTimeBox.fill('');
}
await endTimeBox.fill("10:00 PM");
await page.locator('text=10:00 PM').click();
Logger.info("Selected End time");

    const checkbox = page.getByRole('checkbox', { name: 'Telehealth' });

    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      Logger.info("Telehealth checkbox was not checked — now checked.");
    } else {
      Logger.info("Telehealth checkbox was already checked.");
  }

    // Save the availability settings
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    Logger.info('💾 Provider availability saved successfully');
 });