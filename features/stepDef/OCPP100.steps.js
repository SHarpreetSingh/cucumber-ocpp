const { Given, When, Then, AfterAll, BeforeAll, After } = require('@cucumber/cucumber');
const WebSocket = require('ws');
const assert = require('assert');

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
    console.debug(`[OCPP] → Sending ${action} request`);
    console.debug("📤 Sending:", message);
    ws.send(JSON.stringify(message));

    const timer = setTimeout(() => {
      reject(new Error(`⏳ Timeout waiting for ${action} response`));
    }, 5000);
    console.debug(`[OCPP] ← ${action} confirmation received`);
    ws.once("message", (raw) => {

      clearTimeout(timer);
      const data = JSON.parse(raw.toString());
      console.log("📩 Received:", data);

      lastResponse = data;
      resolve(data);
    });
  });
}

BeforeAll(async function () {
  ws = new WebSocket(
    "ws://192.168.0.165:8180/steve/websocket/CentralSystemService/CP01",
    ["ocpp1.6"]
  );

  await new Promise((resolve, reject) => {
    ws.on("open", () => {
      console.log("Connected to CSMS OCPP server.......");
      resolve();
    });

    ws.on("error", reject);
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
        console.log("🔌 WebSocket closed");
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
    chargePointVendor: "TestVendor",
    chargePointModel: "TestModel"
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
  assert.strictEqual(lastResponse[2].idTagInfo.status, expectedStatus);
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
When("CP send the MeterValues request for connector with transactionId to CSMS", { timeout: 60 * 1000 },
  async function () {
    const meterIntervalSeconds = 5;
    meterInterval = setInterval(async () => {
      await sendMessage("MeterValues", {
        connectorId: 1,
        transactionId,
        meterValue: [{
          "timestamp": new Date().toISOString(),
          sampledValue: [{
            value: (Math.random() * 10000).toFixed(0), // energy reading
            measurand: "Energy.Active.Import.Register",
            unit: "Wh"
          }]
        }],
      });
    }, meterIntervalSeconds * 1000);

    await delay(25 * 1000)
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
      idTag,
      meterStop: 100,
      timestamp: new Date().toISOString()
    });
});

Then("CP should receive a StopTransaction confirmation from CSMS", async function () {
  console.log(lastResponse)
  let [, responseUniqueId] = lastResponse
  assert.ok(lastResponse[2].idTagInfo.status === "Accepted", "No StopTransaction confirmation received");
  await delay(3000);
});

// console.log(`Compliance: ${passedScenarios}/${totalScenarios} = ${score}%`);

