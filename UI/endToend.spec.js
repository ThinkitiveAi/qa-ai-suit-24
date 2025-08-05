import { test, expect } from '@playwright/test';
import Logger from '../utils/logger.js';

export default async function () {
  // Your Playwright script
  Logger.info("Running provider onboarding...");
}

const firstNameStarts = ['Ra', 'Sa', 'An', 'Ki', 'Ni', 'De', 'Pr', 'Vi', 'Me', 'Sh'];
const firstNameEnds   = ['hul', 'shi', 'ta', 'ran', 'jay', 'sha', 'na', 'ket', 'deep', 'a'];

const lastNameStarts = ['Sha', 'Pa', 'Me', 'Sin', 'Ver', 'Red', 'Gu', 'Ag', 'Ba', 'Cho'];
const lastNameEnds   = ['rma', 'tel', 'hta', 'gh', 'ma', 'dy', 'pta', 'wal', 'dra', 'udh'];

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

test('Add Provider User', async ({ page }) => {
    Logger.info('Starting adding provider');
    await login(page);
    // Step 4: Navigate to Settings → User Settings → Providers
    //Logger.log('⚙️ Step 4: Navigating to Provider settings...');
    await page.locator('a:has-text("Settings"), button:has-text("Settings"), [data-testid*="settings"]')
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByText('User Settings', { exact: true }).click();
    await page.waitForTimeout(500);

    await page.getByText('Providers', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    Logger.info('✅ Successfully navigated to Providers section');

    // Step 5: Click "Add Provider User"
    await page.getByRole('button', { name: 'Add Provider User' }).click();
    //await page.waitForTimeout(500);
    Logger.info('✅ Add Provider form opened');

    // Step 6: Fill form
    Logger.info('Started Filling form...');
    function getRandomFrom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateFirstName() {
      return getRandomFrom(firstNameStarts) + getRandomFrom(firstNameEnds);
    }

    function generateLastName() {
      return getRandomFrom(lastNameStarts) + getRandomFrom(lastNameEnds);
    }
    const firstName = generateFirstName();
    const lastName = generateLastName();

    Logger.info(`Generated Name: ${firstName} ${lastName}`);
    await page.locator('input[name="firstName"], input[placeholder*="First Name" i]').fill(firstName);
    await page.locator('input[name="lastName"], input[placeholder*="Last Name" i]').fill(lastName);
    Logger.info('✅ Provider name is entered');

    await page.locator('input[name="role"][role="combobox"]').click();
    await page.waitForTimeout(500);
    await page.getByText('Provider', { exact: true }).click();
    Logger.info('✅ Provider role selected');

    await page.locator('input[name="gender"][role="combobox"]').click();
    await page.waitForTimeout(500);
    await page.getByText('Male', { exact: true }).click();
    Logger.info('✅ Gender selected: Male');

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mailinator.com`;
    await page.locator('input[name="email"], input[type="email"]').fill(email);
    Logger.info('✅ Email entered:');

    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible({ timeout: 500 });
    await saveButton.click();
    Logger.info('✅ Save button clicked successfully');



    // Availability
    Logger.info('Starting to add providers availability');
    await page.waitForTimeout(500);
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

    // Fill Provider dropdown - Select  (the newly added provider)
    const fullName = `${firstName} ${lastName}`;

    await page.getByRole('combobox',{name : 'Select Provider'}).click();
    await page.getByRole('combobox', {name : 'Select Provider'}).fill(fullName);
    const providerOption = page.locator(`text="${fullName}"`);
    await expect(providerOption).toBeVisible({ timeout: 500 });
    await providerOption.click();
    Logger.info("✅ provider for availability selected successfully");

    // Select random Time Zone
    await page.getByRole('combobox', {name : 'Time Zone'}).click();
    const options = await page.locator('li[role="option"]').all();
    const randomIndex = Math.floor(Math.random() * options.length);
    const randomOption = options[randomIndex];
    await randomOption.click();
    Logger.info("✅ selected timezone");

    //booking window 
    await page.getByRole('combobox', {name : 'Booking Window'}).click();
    const randomwindow = await page.locator('li[role="option"]').all();
    const randomwindowoption = Math.floor(Math.random() * randomwindow.length);
    const randomselectoption = randomwindow[randomwindowoption];
    await randomselectoption.click();
    Logger.info("✅ selected booking window");


    //random weekdays
    function getRandomItem(array) {
       return array[Math.floor(Math.random() * array.length)];
    }

    const randomWeekday = getRandomItem(weekdays);
    await page.getByText(randomWeekday, { exact: true }).click();
    //await page.waitForTimeout(500);
    Logger.info(`✅ Selected day: ${randomWeekday}`);

    await page.getByRole('combobox', { name: 'Start Time' }).click();
    await page.waitForSelector('li[role="option"]');

    const timeOptions = await page.locator('li[role="option"]').allTextContents();
    if (timeOptions.length < 2) {
      throw new Error("❌ Not enough time options to select start and end.");
    }

    const startIndex = Math.floor(Math.random() * (timeOptions.length - 1));
    const endIndex = Math.floor(Math.random() * (timeOptions.length - startIndex - 1)) + startIndex + 1;
    const selectedStartTime = timeOptions[startIndex];
    Logger.info(`✅ Selected: Start Time = ${selectedStartTime}`);
    await page.getByRole('combobox', { name: 'Start Time' }).fill(selectedStartTime);
    await page.locator(`li[role="option"] >> text="${selectedStartTime}"`).click();
    await page.getByRole('combobox', { name: 'End Time' }).click();
    await page.waitForSelector('li[role="option"]');
    const endTimeOptions = await page.locator('li[role="option"]').allTextContents();
    if (endTimeOptions.length === 0) {
      throw new Error("❌ No end time options available after start time.");
    }
    const randomEndTimeOption = endTimeOptions[Math.floor(Math.random() * endTimeOptions.length)];
    const cleanedEndTime = randomEndTimeOption.split(' ')[0];
    await page.getByRole('combobox', { name: 'End Time' }).fill(cleanedEndTime);
    await page.locator(`li[role="option"] >> text="${randomEndTimeOption}"`).click();
    Logger.info(`✅ Selected End Time: ${randomEndTimeOption}`);

    const checkbox = page.getByRole('checkbox', { name: 'Telehealth' });

    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      Logger.info("✅ Telehealth checkbox was not checked — now checked.");
    } else {
      Logger.info("✅ Telehealth checkbox was already checked.");
    }

    //Select appointment type
    await page.getByRole('combobox', {name : 'Appointment Type'}).click();
    const randomtypes = await page.locator('li[role="option"]').all();
    const randomtypeoption = Math.floor(Math.random() * randomtypes.length);
    const randomtypeselectoption = randomtypes[randomtypeoption];
    const appointmentTypeText = (await randomtypeselectoption.textContent())?.trim();
    await randomtypeselectoption.click();
    Logger.info(`✅ Selected appointment type: ${appointmentTypeText}`);

    // Select duration
    await page.getByRole('combobox', {name : 'Duration'}).click();
    const randomduration = await page.locator('li[role="option"]').all();
    const randomdurationoption = Math.floor(Math.random() * randomduration.length);
    const randomdurationselectoption = randomduration[randomdurationoption];
    await randomdurationselectoption.click();
    Logger.info("✅ selected appointment type");

 
    // Save the availability settings
    await page.getByRole('button', { name: 'Save' }).click();
    //await page.waitForTimeout(500);
    Logger.info('✅ Provider availability saved successfully');


    //Add New Patient
    Logger.info('Starting patient registration test');
    await page.waitForTimeout(500);
    await page.locator('div').filter({ hasText: /^Create$/ }).nth(1).click();
    Logger.info('✅ Clicked Create');

    await page.getByRole('menuitem', { name: 'New Patient' }).click();
    Logger.info('✅ Selected New Patient');

    await page.locator('div').filter({ hasText: /^Enter Patient Details$/ }).click();
    Logger.info('✅ Selected Enter Patient Details');

    await page.getByRole('button', { name: 'Next' }).click();
    Logger.info('✅ Proceeded to patient details form');
    //await page.waitForTimeout(500);

    function generateClientFirstName() {
      return getRandomFrom(firstNameStarts) + getRandomFrom(firstNameEnds);
    }

    function generateClientLastName() {
      return getRandomFrom(firstNameStarts) + getRandomFrom(firstNameEnds);
    }

    

    const clientfirstName = generateClientFirstName();
    const clientlastName = generateClientLastName();

    Logger.info(`✅ Generated Client Name: ${clientfirstName} ${clientlastName}`);
    await page.getByRole('textbox', { name: 'First Name *' }).fill(clientfirstName);
    await page.getByRole('textbox', { name: 'Last Name *' }).fill(clientlastName);
    await page.getByRole('textbox', { name: 'Date Of Birth *' }).fill('01-01-1999');

    //await page.waitForTimeout(500);

    await page.getByRole('combobox', {name : 'Gender'}).click();
    const randomgender = await page.locator('li[role="option"]').all();
    const randomgenderionoption = Math.floor(Math.random() * randomgender.length);
    const randomgenderselectoption = randomgender[randomgenderionoption];
    await randomgenderselectoption.click();
    Logger.info("✅ selected gender");
    
    await page.getByRole('textbox', { name: 'Mobile Number *' }).fill('9876544400');
    const clientemail = `${clientfirstName.toLowerCase()}.${clientlastName.toLowerCase()}@mailinator.com`;
    await page.locator('input[name="email"], input[type="email"]').fill(clientemail);
    Logger.info('✅ Email entered:');

    await page.getByRole('button', { name: 'Save' }).click();
    Logger.info('✅ Clicked Save');
    //await page.waitForTimeout(2000);
    await page.waitForURL('**/patients');
    await expect(page.getByRole('tab', { name: 'Patients', selected: true })).toBeVisible();
    Logger.info('Verified navigation to patients page');

    // await expect(page.locator('text=Patient Details Added Successfully')).toBeVisible();
    // Logger.info('✅ Verified patient creation success message');
    

    //Appointment 
    Logger.info('Starting to add Appointment');
    //await page.waitForTimeout(500);
    await page.getByRole('tab', { name: 'Scheduling' }).click();
    await page.getByText('Appointments').click();
    Logger.info('✅ Successfully navigated to Appointment section');
    await page.getByRole('button', { name: 'Schedule Appointment' }).click();
    //await page.waitForTimeout(1000);
    Logger.info('✅ Edit Availability modal opened');
    await page.getByRole('menuitem', { name: 'New Appointment' }).click();


    const clientfullName = `${clientfirstName} ${clientlastName}`;

    await page.getByRole('combobox',{name : 'Patient Name'}).click();
    await page.getByRole('combobox', {name : 'Patient Name'}).fill(clientfullName);
    const clientOption = page.locator(`text="${clientfullName}"`);
    await expect(clientOption).toBeVisible({ timeout: 500 });
    await clientOption.click();
    Logger.info('✅ Patient for appointment selected successfully, ${clientfullName}');

    await page.getByRole('combobox', {name : 'Appointment Type'}).click();
    await page.getByRole('option', { name: appointmentTypeText }).click(); 
    //await page.locator(`li[role="option"]`, { hasText: appointmentTypeText }).click();
    Logger.info(`✅ Re-selected appointment type on second page: ${appointmentTypeText}`);

    await page.getByPlaceholder('Reason').click();
    await page.getByPlaceholder('Reason').fill('Fever');
    Logger.info('Filled reason for visit');

    await page.getByRole('combobox', {name : 'Timezone'}).click();
    await page.getByRole('combobox', {name : 'Timezone'}).fill("Indian Standard Time (GMT +05:30)");
    await page.waitForSelector('text=Indian Standard Time (GMT +05:30)');
    await page.locator('text=Indian Standard Time (GMT +05:30)').click();
    Logger.info("selected timezone");
    await page.getByRole('button', { name: 'Telehealth' }).click();

    const providerfullName = `${firstName} ${lastName}`;

    await page.getByRole('combobox',{name : 'Provider'}).click();
    await page.getByRole('combobox', {name : 'Provider'}).fill(fullName);
    const providerOptions = page.locator(`text="${providerfullName}"`);
    await expect(providerOptions).toBeVisible({ timeout: 500 });
    await providerOptions.click();
    Logger.info("✅ provider for availability selected successfully");
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