const { Given, When, Then, AfterAll, BeforeAll, After } = require('@cucumber/cucumber');
const WebSocket = require('ws');
const assert = require('assert');
const axios = require('axios');


let ws;
let lastResponse;
let transactionId;
let totalScenarios = 0;
let passedScenarios = 0;
let uniqueId;
let meterInterval;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility to send OCPP message
function sendMessage(action, payload = {}) {
  return new Promise((resolve, reject) => {
    uniqueId = Date.now().toString();
    const message = [2, uniqueId, action, payload];
    console.debug(`[OCPP] â†’ Sending ${action} request`);
    console.debug("ðŸ“¤ Sending:", message);
    ws.send(JSON.stringify(message));

    const timer = setTimeout(() => {
      reject(new Error(`â³ Timeout waiting for ${action} response`));
    }, 5000);
    console.debug(`[OCPP] â† ${action} confirmation received`);
    ws.once("message", (raw) => {

      clearTimeout(timer);
      const data = JSON.parse(raw.toString());
      console.log("ðŸ“© Received:", data);

      lastResponse = data;
      resolve(data);
    });
  });
}

const chargepoint = "CP_MANUAL_003"

BeforeAll(async function () {
  // ws://192.168.0.165:8180/steve/websocket/CentralSystemService/
  // "ws://127.0.0.1:3000/CP_MANUAL_003",

  ws = new WebSocket(
    `ws://127.0.0.1:3000/${chargepoint}`,
    ["ocpp1.6"]
  );
  await new Promise((resolve, reject) => {
    ws.on("open", () => {
      console.log("Connected to CSMS OCPP server.......");
      resolve();
    });

    ws.on("error", reject);
  });

  ws.on('message', (raw) => {
    console.log("raw-->", raw)
    const message = JSON.parse(raw.toString());
    console.log("ws on message==>", message)
    const [msgType, msgId, action, payload] = message;

    if (msgType === 2 && action === "RemoteStartTransaction") {
      console.log(`[CP] Received RemoteStartTransaction.req (ID: ${msgId}) - RESPONDING NOW`);

      // 1. Send the confirmation (Type 3) immediately
      const confrmtn = [3, msgId, { status: "Accepted" }];
      ws.send(JSON.stringify(confrmtn));

      console.log(`[CP] Sent RemoteStartTransaction.conf`);

    } else if (msgType === 2 && action === "RemoteStopTransaction") {
      console.log(`[CP] Received RemoteStopTransaction.req (ID: ${msgId}) - RESPONDING NOW`);

      const confrmtn = [3, msgId, { status: "Accepted" }];
      ws.send(JSON.stringify(confrmtn));

      console.log(`[CP] Sent RemoteStopTransaction.conf`);
    }
    else if (msgType === 2 && action === "GetDiagnostics") {
      const confrmtn = [3, msgId, { "fileName": "CP42-Logs-20251208.zip" }];
      ws.send(JSON.stringify(confrmtn));
    }
    else if (msgType === 2 && action === "UpdateFirmware") {
      const confrmtn = [3, msgId, { "status": "Accepted" }];
      console.log("confrmtn", confrmtn)
      ws.send(JSON.stringify(confrmtn));
    }
  });
  await delay(3000);
});

After(function (scenario) {
  totalScenarios++;

  if (scenario.result.status === 'PASSED') {
    passedScenarios++;
  }
});

AfterAll(async function () {
  if (ws && ws.readyState === ws.OPEN) {
    await new Promise((resolve) => {
      ws.close();
      ws.on("close", () => {
        console.log("ðŸ”Œ WebSocket closed");
        resolve();
      });
    });
  }

  const score = (passedScenarios / totalScenarios) * 100;
  console.log("\n=====================");
  // console.log(`Total Scenarios: ${totalScenarios}`);
  // console.log(`Passed Scenarios: ${passedScenarios}`);
  console.log(`Client OCPP 1.6 compliance Score: ${score.toFixed(2)} %`);
  console.log("=====================\n");
});

// -------------------- BootNotification --------------------
When("CP sends a BootNotification request to CSMS to register the charger", async function () {
  lastResponse = await sendMessage("BootNotification", {
    chargePointVendor: "vendor1",
    chargePointModel: "Model1"
  });
});

Then("CP should receive a BootNotification from CSMS with confirmation status {string}", async function (expectedStatus) {
  assert.strictEqual(lastResponse[2].status, expectedStatus);
  await delay(3000);
});

// -------------------- Heartbeat --------------------
When("CP sends a Heartbeat request to CSMS", async function () {
  lastResponse = await sendMessage("Heartbeat", {});
});

Then("CP should receive a Heartbeat acknowledgment with the current time from CSMS", async function () {
  assert.ok(lastResponse[2].currentTime, "No currentTime in response");
  await delay(3000);
});

// -------------------- Authorize --------------------
When("CP send an Authorize request with idTag {string} to CSMS", async function (idTag) {
  lastResponse = await sendMessage("Authorize", { idTag });
});

Then("CP should receive an Authorize and confirmation status as {string} from CSMS", async function (expectedStatus) {
  assert.strictEqual(lastResponse[2].idtaginfo.status, expectedStatus);
  await delay(3000);
});

// -------------------- StartTransaction --------------------
When("CP send a StartTransaction request with idTag {string} and connectorId {int} to CSMS", async function (idTag, connectorId) {
  lastResponse = await sendMessage("StartTransaction", {
    connectorId,
    idTag,
    meterStart: 0,
    timestamp: new Date().toISOString()
  });
  transactionId = lastResponse[2].transactionId;
});

Then("CP should receive a StartTransaction confirmation with transactionId from CSMS", async function () {
  assert.ok(transactionId, "No transactionId received");
  await delay(3000);
});

// -------------------- StatusNotification --------------------
When("CP send a StatusNotification request for connectorId {int} with status {string} to CSMS",
  async function (connectorId, status) {
    console.log("status", status)
    lastResponse = await sendMessage("StatusNotification", {
      connectorId,
      errorCode: "NoError",
      status,
      timestamp: new Date().toISOString()
    });
  });

Then("CP should receive a StatusNotification confirmation from CSMS", async function () {
  assert.ok(lastResponse[1] === uniqueId, "No StatusNotification confirmation received");
  await delay(3000);
});

// -------------------- MeterValues --------------------
When("CP send the MeterValues request for connectorId {int} with transactionId to CSMS", { timeout: 60 * 1000 },
  async function (connectorId) {
    const meterIntervalSeconds = 5;
    meterInterval = setInterval(async () => {
      await sendMessage("MeterValues", {
        connectorId,
        transactionId,
        meterValue: [{
          "timestamp": new Date().toISOString(),
          "sampledValues": [{
            "value": "125", // energy reading (Math.random() * 10000).toFixed(0
          }]
        }],
      });
    }, meterIntervalSeconds * 1000);

    await delay(6 * 1000)
    clearInterval(meterInterval);
    // console.log("meterInterval", meterInterval)
  })

Then("CP should receive an acknowledgment from CSMS", async function () {
  let [, responseUniqueId] = lastResponse
  assert.ok(responseUniqueId === uniqueId, "No acknowledgment from SteVe");
  await delay(3000);
});

// -------------------- StopTransaction --------------------
When("CP send a StopTransaction request with idTag {string} for that transaction to CSMS", async function (idTag) {
  lastResponse = await sendMessage("StopTransaction",
    {
      transactionId,
      // transactionId:166,
      idTag,
      meterStop: 100,
      timestamp: new Date().toISOString(),
      reason: "Local",
    });
});

Then("CP should receive a StopTransaction confirmation from CSMS", async function () {
  console.log(lastResponse)
  let [, responseUniqueId] = lastResponse
  assert.ok(lastResponse[2].idTagInfo.status === "Accepted", "No StopTransaction confirmation received");
  await delay(3000);
});


const CSMS_API_BASE_URL = "http://localhost:3000/adminApi/chargers"

// -------------------- RemoteStartTransaction --------------------
When('The CSMS sends a RemoteStartTransaction request for connectorId {int} to the CP with idTag {string}',
  { timeout: 60 * 1000 }, async function (connectorId, idTag) {
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/remotestart`;

    try {
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        connectorId,
        idTag
      });
      // Store the successful API response for later checks (if needed)
      // await sendConf();

      // ðŸ”‘ CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload)
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      this.ocppError = error.response ? error.response.data : error;
      throw new Error(`RemoteStart API failed: ${JSON.stringify(this.ocppError)}`);
    }
  });

Then('The CP should respond with a RemoteStartTransaction confirmation status of {string}', async function (expectedStatus) {
  // This step verifies that your CSMS successfully processed the CALLRESULT from the CP
  // and received the expected status (e.g., "Accepted").
  // const responseArray = Buffer.from(`[3,"${msg[1]}",{ "status": "Accepted"}]`)
  // ðŸ”‘ CRITICAL: Assert against the variable saved in the 'When' step
  if (!this.ocppConfirmationPayload || this.ocppConfirmationPayload.status !== expectedStatus) {
    throw new Error(`Expected status "${expectedStatus}" but received: ${JSON.stringify(this.ocppConfirmationPayload)}`);
  }

});

// --- RemoteStopTransaction Scenario Steps ---
When('The CSMS sends a RemoteStopTransaction request for connectorId {int} to the CP for the active transactionId', async function (connectorId) {
  // This step simulates your Express API being hit and sending the
  // RemoteStopTransaction CALL message to the CP using this.transactionId.
  const url = `${CSMS_API_BASE_URL}/${chargepoint}/remotestop`;

  try {
    // Send the HTTP request to your Express server
    const response = await axios.post(url, {
      csTransactionId: transactionId,
    });
    // Store the successful API response for later checks (if needed)
    // this.apiResponseStatus = response.status;
    this.ocppConfirmationPayload = response.data;
    console.log(this.ocppConfirmationPayload)
  } catch (error) {
    this.ocppError = error.response ? error.response.data : error;

    // Note: If the API sends a failure code (400/500), 'this.error' will be set.
    throw new Error(`RemoteStopTransaction API failed: ${JSON.stringify(error)}`);
  }
});

Then('The CP should respond with a RemoteStopTransaction confirmation status of {string}', async function (expectedStatus) {
  // This step verifies the CSMS received the CALLRESULT from the CP with "Accepted".
  if (!this.ocppConfirmationPayload || this.ocppConfirmationPayload.status !== expectedStatus) {
    throw new Error(`Expected status "${expectedStatus}" but received: ${JSON.stringify(this.ocppConfirmationPayload)}`);
  }
});

// -------------------- end --------------------

// function sendConf() {
//   return new Promise((resolve, reject) => {

//     // ws.once("message", (raw) => {
//     //   console.debug(`[OCPP] â†  confirmation received`);
//     //   // clearTimeout(timer);
//     //   const message = JSON.parse(raw.toString());
//     //   console.debug("ðŸ“¤ Sending:", message);
//     // });

//     ws.once('message', (raw) => {
//       const message = JSON.parse(raw.toString());
//       const [msgType, msgId, action, payload] = message;

//       if (msgType === 2 && action === "RemoteStartTransaction") {
//         console.log(`[CP] Received RemoteStartTransaction.req (ID: ${msgId})`);

//         console.log(`[CP] Sent RemoteStartTransaction.conf (status: Accepted)`);
//         // 2. Start the follow-up sequence (StatusNotification, StartTransaction.req)
//         // This happens asynchronously later, handled by subsequent 'When' steps.
//         console.log("ðŸ“© Received:", data);
//         const confrmtn = [3, msgId, { status: "Accepted" }];

//         console.debug(`[OCPP] â†’ Sending  request`);
//         ws.send(JSON.stringify(confrmtn));
//         resolve();
//       }
//       // ... handle other Type 2 messages (RemoteStopTransaction, ChangeAvailability)
//     });
//   });
// }

When('the CSMS sends a GetDiagnostics request with:', async function (dataTable) {
  const data = Object.fromEntries(
    dataTable.rawTable.map(([key, value]) => [key.trim(), value.trim()])
  );

  console.log("data", data)
  const url = `${CSMS_API_BASE_URL}/${chargepoint}`;
  const payload = {
    location: data.location,
    startTime: data.startTime,
    stopTime: data.stopTime
  };

  try {
    const response = await axios.post(`${url}/getDiagnostics`, payload);
    console.log("response", response.data)
    lastResponse = response.data;
  } catch (error) {
    console.log("error" + error)
    this.ocppError = error.response ? error.response.data : error;
    // Note: If the API sends a failure code (400/500), 'this.error' will be set.
    throw new Error(`GetDiagnostics API failed: ${JSON.stringify(error)}`);
  }
});

// Then('the CP should respond with GetDiagnostics status {string}', function (expectedFileName) {
//   assert.strictEqual(lastResponse.result.fileName, expectedFileName);
//   console.log(`GetDiagnostics status: ${expectedFileName}`);
// });

// Simulate CP sending notifications
// Then('the CP should send DiagnosticsStatusNotification with status {string}', async function (status) {
//   const message = [2, Date.now().toString(), 'DiagnosticsStatusNotification', { status }];
//   ws.send(JSON.stringify(message));
//   console.log(`📤 Sent DiagnosticsStatusNotification: ${status}`);
// });

// Then('later the CP should send DiagnosticsStatusNotification with status {string}', async function (status) {
//   const message = [2, Date.now().toString(), 'DiagnosticsStatusNotification', { status }];
//   ws.send(JSON.stringify(message));
//   console.log(`📤 Sent DiagnosticsStatusNotification: ${status}`);
// });

When('the CSMS sends an UpdateFirmware request with:', async function (dataTable) {
  const data = Object.fromEntries(
    dataTable.rawTable.map(([key, value]) => [key.trim(), value.trim()])
  );

  console.log("data", data)
  const url = `${CSMS_API_BASE_URL}/${chargepoint}`;
  try {
    const response = await axios.post(`${url}/update-firmware`, data);
    console.log("response", response.data)
    lastResponse = response.data;
  } catch (error) {
    console.log("error" + error)
    this.ocppError = error.response ? error.response.data : error;
    // Note: If the API sends a failure code (400/500), 'this.error' will be set.
    throw new Error(`UpdateFirmware API failed: ${JSON.stringify(error)}`);
  }
});

Then('the CP should respond with UpdateFirmware status {string}', function (expectedStatus) {
  assert.strictEqual(lastResponse.cpResponsed.status, expectedStatus);
  console.log(`UpdateFirmware status: ${expectedStatus}`);
});

Then('the CP should send FirmwareStatusNotification with status {string}', function (status) {
  // assert.strictEqual(lastResponse.cpResponsed.status, expectedStatus);
  // console.log(`UpdateFirmware status: ${expectedStatus}`);
  const message = [2, Date.now().toString(), 'FirmwareStatusNotification', { status }];
  ws.send(JSON.stringify(message));
});

Then('the CP successfully uploads a file to {string} and reports status', async function (uploadUrl) {
  const reportedFileName = 'CP-TEST-DIAG.zip';
  const uniqueMessageId = Date.now().toString();

  const mockFileContent = 'This is a mock diagnostics file content.';
  const mockFileBlob = new Blob([mockFileContent], { type: 'application/zip' });

  const formData = new FormData();
  // The key 'diagnostics' MUST match the Multer configuration in server.js
  formData.append('diagnostics', mockFileBlob, reportedFileName);

  // --- Step 1: Send "Uploading" Status (WebSocket) ---
  try {
    const uploadStartingMessage = [
      2,
      uniqueMessageId,
      'DiagnosticsStatusNotification',
      { status: 'Uploading' }
    ];
    // We use ws.send() because this is a WebSocket message
    ws.send(JSON.stringify(uploadStartingMessage));
    console.log(`[SIMULATOR] Status Sent: Uploading (MTID 4)`);

    // --- Step 2: Execute the File Transfer (HTTP Fetch) ---
    // const url = `${CSMS_API_BASE_URL}/upload/logs`
    const httpResponse = await axios.post(uploadUrl, formData);

    console.log("httpResponse", httpResponse.data.message)
    let finalStatus;
    if (httpResponse.status >= 200 && httpResponse.status < 300) {
      finalStatus = 'Uploaded';
      console.log(`[SIMULATOR] HTTP Upload Success! Status: ${httpResponse.status}`);
    } else {
      finalStatus = 'UploadFailed';
      console.error(`[SIMULATOR] HTTP Upload Failed! Status: ${httpResponse.status}`);
    }

    const uploadFinalMessage = [
      2,
      (Date.now() + 1).toString(), // New unique ID for the final message
      'DiagnosticsStatusNotification',
      { status: finalStatus }
    ];

    // Send the final status via WebSocket
    ws.send(JSON.stringify(uploadFinalMessage));
    console.log(`[SIMULATOR] Final Status Sent: ${finalStatus} (MTID 4)`);

  } catch (error) {
    console.error('An error occurred during the fetch or WebSocket operation:', error);

    // If a network error or connection error occurs, send UploadFailed
    const uploadFailedMessage = [
      4,
      (Date.now() + 2).toString(),
      'DiagnosticsStatusNotification',
      { status: 'UploadFailed' }
    ];
    ws.send(JSON.stringify(uploadFailedMessage));
  }
});


