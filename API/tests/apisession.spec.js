const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * eCareHealth API End-to-End Test Suite
 * Tests the complete healthcare appointment booking workflow
 * 
 * Test Flow:
 * 1. Provider Login → Store access token
 * 2. Add Provider → Validate creation
 * 3. Get Provider → Fetch provider UUID
 * 4. Set Availability → Configure provider schedule
 * 5. Create Patient → Add patient with random data
 * 6. Get Patient → Fetch patient UUID
 * 7. Book Appointment → Create appointment using both UUIDs
 */

// Configuration
const CONFIG = {
  baseURL: 'https://stage-api.ecarehealth.com',
  tenant: 'stage_aithinkitive',
  timeout: 30000,
  credentials: {
    username: 'rose.gomez@jourrapide.com',
    password: 'Pass@123'
  }
};

// Test data generators
const generateRandomPatientData = () => {
  const firstNames = ['Samuel', 'Emma', 'Michael', 'Sarah', 'David', 'Jessica', 'Robert', 'Ashley', 'John', 'Lisa'];
  const lastNames = ['Peterson', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
  const genders = ['MALE', 'FEMALE'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  
  return { firstName, lastName, gender };
};

const generateProviderData = () => {
  const timestamp = Date.now();
  return {
    firstName: 'Steven',
    lastName: 'Miller',
    email: `steven.miller.${timestamp}@test.com`,
    gender: 'MALE'
  };
};

// Common headers
const getCommonHeaders = (accessToken = null) => ({
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'X-TENANT-ID': CONFIG.tenant,
  ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
});

// Test data storage
let testContext = {
  accessToken: null,
  providerUuid: null,
  patientUuid: null,
  providerData: null,
  patientData: null,
  testResults: []
};

// HTML Report Generator
const generateHTMLReport = (testResults) => {
  const timestamp = new Date().toISOString();
  const passedTests = testResults.filter(t => t.status === 'PASSED').length;
  const failedTests = testResults.filter(t => t.status === 'FAILED').length;
  const successRate = Math.round((passedTests / testResults.length) * 100);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eCareHealth API Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h1 { margin: 0; color: #333; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; color: #666; font-size: 1.1em; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .metric-value { font-size: 3em; font-weight: bold; margin-bottom: 10px; }
        .metric-value.success { color: #4CAF50; }
        .metric-value.danger { color: #f44336; }
        .metric-value.info { color: #2196F3; }
        .test-case { background: white; margin-bottom: 20px; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .test-header { padding: 20px; font-weight: bold; color: white; font-size: 1.2em; }
        .test-header.passed { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .test-header.failed { background: linear-gradient(135deg, #f44336, #d32f2f); }
        .test-content { padding: 25px; }
        .endpoint { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; display: inline-block; margin: 5px 0; }
        .validation { margin: 10px 0; padding: 12px; border-radius: 8px; }
        .validation.passed { background: #e8f5e8; border-left: 5px solid #4CAF50; }
        .validation.failed { background: #ffeaea; border-left: 5px solid #f44336; }
        .test-data { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .json-data { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 eCareHealth API Test Report</h1>
            <p>End-to-End API Testing Results - Generated on ${new Date(timestamp).toLocaleString()}</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value success">${passedTests}</div>
                <div>Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value danger">${failedTests}</div>
                <div>Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value info">${testResults.length}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value ${successRate === 100 ? 'success' : 'danger'}">${successRate}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        ${testResults.map(test => `
            <div class="test-case">
                <div class="test-header ${test.status.toLowerCase()}">
                    ${test.status === 'PASSED' ? '✅' : '❌'} Step ${test.step}: ${test.name} - ${test.status}
                </div>
                <div class="test-content">
                    <p><strong>Endpoint:</strong> <span class="endpoint">${test.endpoint}</span></p>
                    <p><strong>Status Code:</strong> ${test.actualStatusCode} (Expected: ${test.expectedStatusCode})</p>
                    
                    <h4>Validations:</h4>
                    ${test.validations.map(validation => `
                        <div class="validation ${validation.result.toLowerCase()}">
                            ${validation.result === 'PASSED' ? '✅' : '❌'} ${validation.check} - ${validation.result}
                            ${validation.details ? `<br><small>${validation.details}</small>` : ''}
                        </div>
                    `).join('')}
                    
                    ${test.testData ? `
                        <div class="test-data">
                            <strong>Test Data:</strong><br>
                            ${Object.entries(test.testData).map(([key, value]) => `${key}: ${value}`).join('<br>')}
                        </div>
                    ` : ''}
                    
                    ${test.extractedData ? `
                        <div class="test-data">
                            <strong>Extracted Data:</strong><br>
                            ${Object.entries(test.extractedData).map(([key, value]) => `${key}: ${value}`).join('<br>')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}

        <div style="background: white; padding: 30px; border-radius: 15px; margin-top: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <h2>📋 Test Execution Summary</h2>
            <p><strong>Environment:</strong> Staging (${CONFIG.baseURL})</p>
            <p><strong>Tenant:</strong> ${CONFIG.tenant}</p>
            <p><strong>Total Execution Time:</strong> ~2-3 minutes</p>
            <p><strong>Test Flow:</strong> Login → Add Provider → Get Provider → Set Availability → Create Patient → Get Patient → Book Appointment</p>
            
            ${successRate === 100 ? 
                '<div style="color: #4CAF50; font-weight: bold; font-size: 1.2em;">🎉 All tests completed successfully!</div>' : 
                '<div style="color: #f44336; font-weight: bold; font-size: 1.2em;">⚠️ Some tests failed. Please review the results above.</div>'
            }
        </div>
    </div>
</body>
</html>`;
};

// Main test suite
test.describe('eCareHealth API End-to-End Tests', () => {
  
  test.beforeAll(async () => {
    console.log('🚀 Starting eCareHealth API Test Suite');
    console.log(`📍 Base URL: ${CONFIG.baseURL}`);
    console.log(`🏢 Tenant: ${CONFIG.tenant}`);
  });

  test.afterAll(async () => {
    // Generate test report
    const reportHTML = generateHTMLReport(testContext.testResults);
    const reportPath = path.join(__dirname, 'ecare-api-test-report.html');
    fs.writeFileSync(reportPath, reportHTML);
    
    const jsonReportPath = path.join(__dirname, 'ecare-api-test-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify({
      executionDate: new Date().toISOString(),
      baseURL: CONFIG.baseURL,
      tenant: CONFIG.tenant,
      summary: {
        totalTests: testContext.testResults.length,
        passedTests: testContext.testResults.filter(t => t.status === 'PASSED').length,
        failedTests: testContext.testResults.filter(t => t.status === 'FAILED').length
      },
      results: testContext.testResults
    }, null, 2));
    
    console.log(`📊 Test report generated: ${reportPath}`);
    console.log(`📄 JSON report generated: ${jsonReportPath}`);
  });

  test('Step 1: Provider Login', async ({ request }) => {
    const testStep = {
      step: 1,
      name: 'Provider Login',
      endpoint: 'POST /api/master/login',
      expectedStatusCode: 200,
      validations: []
    };

    try {
      const response = await request.post(`${CONFIG.baseURL}/api/master/login`, {
        headers: getCommonHeaders(),
        data: {
          username: CONFIG.credentials.username,
          password: CONFIG.credentials.password,
          xTENANTID: CONFIG.tenant
        }
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(200);
      testStep.validations.push({ check: 'Status Code 200', result: 'PASSED' });

      expect(responseData.data.access_token).toBeTruthy();
      testStep.validations.push({ check: 'Access Token Present', result: 'PASSED' });

      expect(responseData.data.access_token.length).toBeGreaterThan(1000);
      testStep.validations.push({ check: 'Token Length > 1000 chars', result: 'PASSED' });

      testContext.accessToken = responseData.data.access_token;
      testStep.status = 'PASSED';
      testStep.extractedData = { tokenLength: responseData.data.access_token.length };

      console.log('✅ Step 1: Provider Login - PASSED');

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Login Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 1: Provider Login - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 2: Add Provider', async ({ request }) => {
    const testStep = {
      step: 2,
      name: 'Add Provider',
      endpoint: 'POST /api/master/provider',
      expectedStatusCode: 201,
      validations: []
    };

    testContext.providerData = generateProviderData();

    try {
      const response = await request.post(`${CONFIG.baseURL}/api/master/provider`, {
        headers: getCommonHeaders(testContext.accessToken),
        data: {
          roleType: "PROVIDER",
          active: false,
          admin_access: true,
          status: false,
          avatar: "",
          role: "PROVIDER",
          firstName: testContext.providerData.firstName,
          lastName: testContext.providerData.lastName,
          gender: testContext.providerData.gender,
          phone: "",
          npi: "",
          specialities: null,
          groupNpiNumber: "",
          licensedStates: null,
          licenseNumber: "",
          acceptedInsurances: null,
          experience: "",
          taxonomyNumber: "",
          workLocations: null,
          email: testContext.providerData.email,
          officeFaxNumber: "",
          areaFocus: "",
          hospitalAffiliation: "",
          ageGroupSeen: null,
          spokenLanguages: null,
          providerEmployment: "",
          insurance_verification: "",
          prior_authorization: "",
          secondOpinion: "",
          careService: null,
          bio: "",
          expertise: "",
          workExperience: "",
          licenceInformation: [{ uuid: "", licenseState: "", licenseNumber: "" }],
          deaInformation: [{ deaState: "", deaNumber: "", deaTermDate: "", deaActiveDate: "" }]
        }
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(201);
      testStep.validations.push({ check: 'Status Code 201', result: 'PASSED' });

      expect(responseData.message).toBe('Provider created successfully.');
      testStep.validations.push({ 
        check: 'Success Message', 
        result: 'PASSED', 
        details: `Expected: "Provider created successfully.", Actual: "${responseData.message}"` 
      });

      testStep.status = 'PASSED';
      testStep.testData = testContext.providerData;

      console.log('✅ Step 2: Add Provider - PASSED');

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Add Provider Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 2: Add Provider - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 3: Get Provider', async ({ request }) => {
    const testStep = {
      step: 3,
      name: 'Get Provider',
      endpoint: 'GET /api/master/provider',
      expectedStatusCode: 200,
      validations: []
    };

    try {
      const response = await request.get(`${CONFIG.baseURL}/api/master/provider?page=0&size=20`, {
        headers: getCommonHeaders(testContext.accessToken)
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(200);
      testStep.validations.push({ check: 'Status Code 200', result: 'PASSED' });

      const createdProvider = responseData.data.content.find(p => 
        p.firstName === testContext.providerData.firstName && 
        p.lastName === testContext.providerData.lastName
      );

      expect(createdProvider).toBeTruthy();
      testStep.validations.push({ 
        check: 'Created Provider Found', 
        result: 'PASSED', 
        details: `${testContext.providerData.firstName} ${testContext.providerData.lastName} found in provider list` 
      });

      expect(createdProvider.uuid).toBeTruthy();
      testStep.validations.push({ check: 'UUID Extracted', result: 'PASSED' });

      testContext.providerUuid = createdProvider.uuid;
      testStep.status = 'PASSED';
      testStep.extractedData = { 
        providerUuid: createdProvider.uuid,
        providerName: `${createdProvider.firstName} ${createdProvider.lastName}`
      };

      console.log('✅ Step 3: Get Provider - PASSED, UUID:', testContext.providerUuid);

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Get Provider Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 3: Get Provider - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 4: Set Availability', async ({ request }) => {
    const testStep = {
      step: 4,
      name: 'Set Availability',
      endpoint: 'POST /api/master/provider/availability-setting',
      expectedStatusCode: 200,
      validations: []
    };

    try {
      const response = await request.post(`${CONFIG.baseURL}/api/master/provider/availability-setting`, {
        headers: getCommonHeaders(testContext.accessToken),
        data: {
          setToWeekdays: false,
          providerId: testContext.providerUuid,
          bookingWindow: "3",
          timezone: "EST",
          bufferTime: 0,
          initialConsultTime: 0,
          followupConsultTime: 0,
          settings: [{ type: "NEW", slotTime: "30", minNoticeUnit: "8_HOUR" }],
          blockDays: [],
          daySlots: [{ 
            day: "MONDAY", 
            startTime: "12:00:00", 
            endTime: "13:00:00", 
            availabilityMode: "VIRTUAL" 
          }],
          bookBefore: "undefined undefined",
          xTENANTID: CONFIG.tenant
        }
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(200);
      testStep.validations.push({ check: 'Status Code 200', result: 'PASSED' });

      const expectedMessage = `Availability added successfully for provider ${testContext.providerData.firstName} ${testContext.providerData.lastName}`;
      expect(responseData.message).toBe(expectedMessage);
      testStep.validations.push({ 
        check: 'Success Message', 
        result: 'PASSED', 
        details: `Expected: "${expectedMessage}", Actual: "${responseData.message}"` 
      });

      testStep.status = 'PASSED';
      testStep.testData = {
        providerId: testContext.providerUuid,
        schedule: 'Monday 12:00-13:00 EST (Virtual)'
      };

      console.log('✅ Step 4: Set Availability - PASSED');

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Set Availability Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 4: Set Availability - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 5: Create Patient', async ({ request }) => {
    const testStep = {
      step: 5,
      name: 'Create Patient',
      endpoint: 'POST /api/master/patient',
      expectedStatusCode: 201,
      validations: []
    };

    testContext.patientData = generateRandomPatientData();

    try {
      const response = await request.post(`${CONFIG.baseURL}/api/master/patient`, {
        headers: getCommonHeaders(testContext.accessToken),
        data: {
          phoneNotAvailable: true,
          emailNotAvailable: true,
          registrationDate: "",
          firstName: testContext.patientData.firstName,
          middleName: "",
          lastName: testContext.patientData.lastName,
          timezone: "IST",
          birthDate: "1994-08-16T18:30:00.000Z",
          gender: testContext.patientData.gender,
          ssn: "",
          mrn: "",
          languages: null,
          avatar: "",
          mobileNumber: "",
          faxNumber: "",
          homePhone: "",
          address: {
            line1: "", line2: "", city: "", state: "", country: "", zipcode: ""
          },
          emergencyContacts: [{ firstName: "", lastName: "", mobile: "" }],
          patientInsurances: [{
            active: true, insuranceId: "", copayType: "FIXED", coInsurance: "",
            claimNumber: "", note: "", deductibleAmount: "", employerName: "",
            employerAddress: { line1: "", line2: "", city: "", state: "", country: "", zipcode: "" },
            subscriberFirstName: "", subscriberLastName: "", subscriberMiddleName: "",
            subscriberSsn: "", subscriberMobileNumber: "",
            subscriberAddress: { line1: "", line2: "", city: "", state: "", country: "", zipcode: "" },
            groupId: "", memberId: "", groupName: "", frontPhoto: "", backPhoto: "",
            insuredFirstName: "", insuredLastName: "",
            address: { line1: "", line2: "", city: "", state: "", country: "", zipcode: "" },
            insuredBirthDate: "", coPay: "", insurancePayer: {}
          }],
          emailConsent: false,
          messageConsent: false,
          callConsent: false,
          patientConsentEntities: [{ signedDate: "2025-07-24T08:07:34.316Z" }]
        }
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(201);
      testStep.validations.push({ check: 'Status Code 201', result: 'PASSED' });

      expect(responseData.message).toBe('Patient Details Added Successfully.');
      testStep.validations.push({ 
        check: 'Success Message', 
        result: 'PASSED', 
        details: `Expected: "Patient Details Added Successfully.", Actual: "${responseData.message}"` 
      });

      testStep.status = 'PASSED';
      testStep.testData = testContext.patientData;

      console.log('✅ Step 5: Create Patient - PASSED:', `${testContext.patientData.firstName} ${testContext.patientData.lastName}`);

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Create Patient Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 5: Create Patient - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 6: Get Patient', async ({ request }) => {
    const testStep = {
      step: 6,
      name: 'Get Patient',
      endpoint: 'GET /api/master/patient',
      expectedStatusCode: 200,
      validations: []
    };

    try {
      const response = await request.get(`${CONFIG.baseURL}/api/master/patient?page=0&size=20&searchString=`, {
        headers: getCommonHeaders(testContext.accessToken)
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations
      expect(response.status()).toBe(200);
      testStep.validations.push({ check: 'Status Code 200', result: 'PASSED' });

      const createdPatient = responseData.data.content.find(p => 
        p.firstName === testContext.patientData.firstName && 
        p.lastName === testContext.patientData.lastName
      );

      expect(createdPatient).toBeTruthy();
      testStep.validations.push({ 
        check: 'Created Patient Found', 
        result: 'PASSED', 
        details: `${testContext.patientData.firstName} ${testContext.patientData.lastName} found in patient list` 
      });

      expect(createdPatient.uuid).toBeTruthy();
      testStep.validations.push({ check: 'UUID Extracted', result: 'PASSED' });

      testContext.patientUuid = createdPatient.uuid;
      testStep.status = 'PASSED';
      testStep.extractedData = { 
        patientUuid: createdPatient.uuid,
        patientName: `${createdPatient.firstName} ${createdPatient.lastName}`
      };

      console.log('✅ Step 6: Get Patient - PASSED, UUID:', testContext.patientUuid);

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Get Patient Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 6: Get Patient - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

  test('Step 7: Book Appointment', async ({ request }) => {
    const testStep = {
      step: 7,
      name: 'Book Appointment',
      endpoint: 'POST /api/master/appointment',
      expectedStatusCode: 200,
      validations: []
    };

    // Generate future appointment time that matches availability (Monday 12-1 PM EST)
    const futureDate = new Date();
    const daysUntilMonday = (8 - futureDate.getDay()) % 7 || 7;
    futureDate.setDate(futureDate.getDate() + daysUntilMonday);
    futureDate.setHours(17, 0, 0, 0); // 5 PM UTC = 12 PM EST
    
    const startTime = futureDate.toISOString();
    const endDate = new Date(futureDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    const endTime = endDate.toISOString();

    try {
      const response = await request.post(`${CONFIG.baseURL}/api/master/appointment`, {
        headers: getCommonHeaders(testContext.accessToken),
        data: {
          mode: "VIRTUAL",
          patientId: testContext.patientUuid,
          customForms: null,
          visit_type: "",
          type: "NEW",
          paymentType: "CASH",
          providerId: testContext.providerUuid,
          startTime: startTime,
          endTime: endTime,
          insurance_type: "",
          note: "",
          authorization: "",
          forms: [],
          chiefComplaint: "appointment test",
          isRecurring: false,
          recurringFrequency: "daily",
          reminder_set: false,
          endType: "never",
          endDate: "2025-07-24T08:07:34.318Z",
          endAfter: 5,
          customFrequency: 1,
          customFrequencyUnit: "days",
          selectedWeekdays: [],
          reminder_before_number: 1,
          timezone: "EST",
          duration: 30,
          xTENANTID: CONFIG.tenant
        }
      });

      const responseData = await response.json();
      testStep.actualStatusCode = response.status();

      // Validations - Accept both 200 and 201 as success
      expect([200, 201]).toContain(response.status());
      testStep.validations.push({ 
        check: 'Status Code 200/201', 
        result: 'PASSED', 
        details: `Got ${response.status()} (Both 200 and 201 are acceptable)` 
      });

      expect(responseData.message).toBe('Appointment booked successfully.');
      testStep.validations.push({ 
        check: 'Success Message', 
        result: 'PASSED', 
        details: `Expected: "Appointment booked successfully.", Actual: "${responseData.message}"` 
      });

      testStep.status = 'PASSED';
      testStep.testData = {
        patientId: testContext.patientUuid,
        providerId: testContext.providerUuid,
        appointmentTime: startTime,
        duration: '30 minutes',
        mode: 'VIRTUAL'
      };

      console.log('✅ Step 7: Book Appointment - PASSED');

    } catch (error) {
      testStep.status = 'FAILED';
      testStep.error = error.message;
      testStep.validations.push({ check: 'Book Appointment Failed', result: 'FAILED', details: error.message });
      console.log('❌ Step 7: Book Appointment - FAILED:', error.message);
      throw error;
    }

    testContext.testResults.push(testStep);
  });

});

// Run with: npx playwright test ecare-api-tests.spec.js --reporter=html