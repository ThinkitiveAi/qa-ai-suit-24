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

// =========================
// Test 1: Patient Registration
// =========================


test('Appointment Booking - New Patient Visit', async ({ page }) => {
  Logger.info('Starting appointment booking test');
  await login(page);


// Navigate to Scheduling
  await page.getByRole('tab', { name: 'Scheduling' }).click();
  await page.getByText('Appointments').click();
  Logger.info('✅ Successfully navigated to Appointments section');
  await page.getByRole('button', { name: 'Schedule Appointment' }).click();
  Logger.info('Options displayed successfully');

  await page.getByRole('menuitem', { name: /New Appointment/i }).click();
  Logger.info('✅ Schedule Appointment modal opened');

  await page.getByPlaceholder('Search Patient').click();
  await page.getByPlaceholder('Search Patient').fill('Rohini Margane'); // Replace with dynamic name if needed
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  Logger.info('Selected patient for appointment');

  await page.getByPlaceholder('Select Type').click();
  await page.getByRole('option', { name: 'New Patient Visit' }).click();
  Logger.info('Selected appointment type');

  await page.getByPlaceholder('Reason').click();
  await page.getByPlaceholder('Reason').fill('Fever');
  Logger.info('Filled reason for visit');

  await page.getByRole('combobox', {name : 'Timezone'}).click();
  await page.getByRole('combobox', {name : 'Timezone'}).fill("Indian Standard Time (GMT +05:30)");
  await page.waitForSelector('text=Indian Standard Time (GMT +05:30)');
  await page.locator('text=Indian Standard Time (GMT +05:30)').click();
  Logger.info("selected timezone");

  await page.getByRole('button', { name: 'Telehealth' }).click();
  await page.getByRole('combobox',{name : 'Provider'}).click();
  await page.getByRole('combobox', {name : 'Provider'}).fill("Rohini olive");
  await page.waitForSelector('text=Rohini olive');
  await page.locator('text=Rohini olive').click();
  Logger.info("selected provider for availability");


  await page.locator('button:has-text("View availability")').click()


  const currentDate = new Date();
  //const currentDay = currentDate.getDate();
  
  let slotFound = false;
  let attemptCount = 0;
  const maxAttempts = 30; // Limit to prevent infinite loop
  
  while (!slotFound && attemptCount < maxAttempts) {
    attemptCount++;
    Logger.info(`Attempt ${attemptCount}: Checking for available slots...`);
    
    try {
      // Calculate the target date (current date + attempt - 1)
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + attemptCount - 1);
      const targetDay = targetDate.getDate().toString();
      
      Logger.info(`Looking for date: ${targetDay}`);
      
      // Wait a moment for calendar to load
      await page.waitForTimeout(500);
      
      // Look for the date cell in the calendar
      const calendarContainer = page.locator('div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-6.css-1ytf872');

    const dateCell = calendarContainer.locator(
      'button.MuiPickersDay-root:not(.Mui-disabled):not(.MuiPickersDay-hidden)'
    ).filter({ hasText: targetDay });
      
      // Check if the date exists and is clickable
      const dateExists = await dateCell.count() > 0;
      
      if (dateExists) {
        // Click on the date
        await dateCell.first().click();
        Logger.info(`Clicked on date: ${targetDay}`);
        
        // Wait for slots to load
        await page.waitForTimeout(2000);
        
        // Check for "No Slots Available" message
        const noSlotsMessage = page.locator('text=No Slots Available');
        const hasNoSlotsMessage = await noSlotsMessage.count() > 0;
        
        if (!hasNoSlotsMessage) {
          // Look for available time slots
          const timeSlots = page.locator('[data-testid="time-slot"], .time-slot, button:has-text("AM"), button:has-text("PM")');
          const slotCount = await timeSlots.count();
          
          if (slotCount > 0) {
            console.log(`Found ${slotCount} available slots for date ${targetDay}`);
            
            // Select the first available slot
            await timeSlots.first().click();
            slotFound = true;
            break;
            
          } else {
            Logger.info(`No time slots found for date ${targetDay}`);
          }
        } else {
          Logger.info(`No slots available for date ${targetDay}`);
        }
      } else {
        Logger.info(`Date ${targetDay} not found or not clickable`);
      }
      
    } catch (error) {
      console.log(`Error on attempt ${attemptCount}:`, error.message);
    }
  }
  
  if (slotFound) {
    console.log('Successfully found and selected an available slot!');
    
    // Take a screenshot of the confirmation
    await page.screenshot({ path: 'appointment_booked.png' });
    
  } else {
    console.log(`No available slots found after ${maxAttempts} attempts`);
    throw new Error('No available slots found within the search period');
  }

  await page.getByRole('button', { name: 'Save And Close' }).click();
  await page.waitForTimeout(2000);
  Logger.info('Appointment saved successfully');

});

  