const {
  Given,
  When,
  Then,
  AfterAll,
  BeforeAll,
  After,
} = require("@cucumber/cucumber");
const WebSocket = require("ws");
const assert = require("assert");
const { handleConnection, sendMessage } = require("./beforeAll");
const reporter = require("../../OCPP_reporter");
const { resolveObjectURL } = require("buffer");
let ws;

let lastResponse, request, response;
let transactionId;
let totalScenarios = 0;
let passedScenarios = 0;
const axios = require("axios");
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Utility to send OCPP message

BeforeAll(async function () {
  await handleConnection();
});

After(function (scenario) {
  totalScenarios++;

  if (scenario.result.status === "PASSED") {
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
  // ✅ CORRECT LOCATION: Use the imported 'reporter' object to call the function.
  // This executes once, at the very end of your entire test suite run.
  try {
    const reportPath = reporter.generateHTMLReport();
    console.log(`✅ Final HTML Report available at: ${reportPath}`);
  } catch (error) {
    console.error("❌ Failed to generate final report:", error.message);
  }

  const score = (passedScenarios / totalScenarios) * 100;
  console.log("\n=====================");
  // console.log(`Total Scenarios: ${totalScenarios}`);
  // console.log(`Passed Scenarios: ${passedScenarios}`);
  console.log(`Client OCPP 1.6 compliance Score: ${score.toFixed(2)} %`);
  console.log("=====================\n");
});

// -------------------- BootNotification --------------------
When(
  "CP sends a BootNotification request to CSMS to register the charger",
  async function () {
    lastResponse = await sendMessage("BootNotification", {
      chargePointVendor: "TestVendor",
      chargePointModel: "TestModel",
      chargePointSerialNumber: "CP01",
      firmwareVersion: "1.2.3",
    });
  }
);

Then(
  "CP should receive a BootNotification from CSMS with confirmation status {string}",
  async function (expectedStatus) {
    // console.log("expectedStatus===>>>", expectedStatus);
    // console.log("lastResponse===>>>", request);
    const { request, response } = lastResponse;
    const messageName = "BootNotification";
    try {
      assert.strictEqual(lastResponse.response[2].status, expectedStatus);
      // simulate sending request & receiving response
      reporter.logScenario(messageName, "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        messageName,
        "fail",
        request,
        response,
        "Format Voilation"
      );
    }
    //await delay(3000);
  }
);

// -------------------- Heartbeat --------------------
When("CP sends a Heartbeat request to CSMS", async function () {
  lastResponse = await sendMessage("Heartbeat", {});
});

Then(
  "CP should receive a Heartbeat acknowledgment with the current time from CSMS",
  async function () {
    const { request, response } = lastResponse;

    //await delay(3000);
    try {
      assert.ok(
        lastResponse.response[2].currentTime,
        "No currentTime in response"
      );
      // simulate sending request & receiving response
      reporter.logScenario("Heartbeat", "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        "Heartbeat",
        "Fail",
        request,
        response,
        "No currentTime in response"
      );
    }
  }
);

// -------------------- Authorize --------------------
When(
  "CP send an Authorize request with idTag {string} to CSMS",
  async function (idTag) {
    lastResponse = await sendMessage("Authorize", { idTag });
  }
);

Then(
  "CP should receive an Authorize and confirmation status as {string} from CSMS",
  async function (expectedStatus) {
    const { request, response } = lastResponse;
    try {
      assert.strictEqual(lastResponse[2].idTagInfo.status, expectedStatus);
      // simulate sending request & receiving response
      reporter.logScenario("Authorize", "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        "Authorize",
        "Fail",
        request,
        response,
        "Invalid Or expired IDTAG"
      );
    }
  }
);

// -------------------- StartTransaction --------------------
When(
  "CP send a StartTransaction request with idTag {string} and connectorId {int} to CSMS",
  async function (idTag, connectorId) {
    lastResponse = await sendMessage("StartTransaction", {
      connectorId,
      idTag,
      meterStart: 0,
      timestamp: new Date().toISOString(),
    });
    console.log(
      "StartTransaction lastResponse==>>>",
      lastResponse.response[2].transactionId
    );
    transactionId = lastResponse.response[2].transactionId;
  }
);

Then(
  "CP should receive a StartTransaction confirmation with transactionId from CSMS",
  async function () {
    const { request, response } = lastResponse;
    try {
      assert.ok(transactionId, "No transactionId received");
      // simulate sending request & receiving response
      reporter.logScenario("StartTransaction", "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        "StartTransaction",
        "Fail",
        request,
        response,
        "Missing TransactionId"
      );
    }
    //await delay(3000);
  }
);

// -------------------- StatusNotification --------------------
When(
  "CP send a StatusNotification request for connectorId {int} with status {string} to CSMS",
  async function (connectorId, status) {
    console.log("status", status);
    lastResponse = await sendMessage("StatusNotification", {
      connectorId,
      errorCode: "NoError",
      status,
      timestamp: new Date().toISOString(),
    });
  }
);

Then(
  "CP should receive a StatusNotification confirmation from CSMS",
  async function () {
    const { request, response } = lastResponse;
    if (response[4]) {
      assert.fail("Error");
    }
    try {
      assert.ok(
        (lastResponse[4] = "available"),
        "No StatusNotification confirmation received"
      );
      // simulate sending request & receiving response
      reporter.logScenario("StatusNotification", "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        "StatusNotification",
        "Fail",
        request,
        response,
        "Invalid status"
      );
    }
    //await delay(3000);
  }
);

let meterInterval;
// -------------------- MeterValues --------------------
When(
  "CP send the MeterValues request for connector with transactionId to CSMS",
  { timeout: 60 * 1000 },
  async function () {
    const meterIntervalSeconds = 5; //
    meterInterval = setInterval(async () => {
      await sendMessage("MeterValues", {
        connectorId: 1,
        transactionId,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValues: [
              {
                value: "125",
              },
            ],
          },
        ],
      });
    }, meterIntervalSeconds * 1000);

    await delay(6 * 1000);
    clearInterval(meterInterval);
    // console.log("meterInterval", meterInterval)
  }
);

Then("CP should receive an acknowledgment from CSMS", async function () {
  const { request, response } = lastResponse;
  try {
    assert.ok(response[2] !== undefined, "No acknowledgment from SteVe");
    // simulate sending request & receiving response
    reporter.logScenario("MeterValues", "Pass", request, response);
  } catch (err) {
    reporter.logScenario(
      "MeterValues",
      "Fail",
      request,
      response,
      "No acknowledgment from SteVe"
    );
  }

  //await delay(3000);
});

// -------------------- StopTransaction --------------------
When(
  "CP send a StopTransaction request with idTag {string} for that transaction to CSMS",
  async function (idTag) {
    lastResponse = await sendMessage("StopTransaction", {
      transactionId,
      idTag,
      meterStop: 100,
      timestamp: new Date().toISOString(),
    });
  }
);

Then(
  "CP should receive a StopTransaction confirmation from CSMS",
  async function () {
    const { request, response } = lastResponse;
    try {
      assert.ok(response[2] !== undefined, "No acknowledgment from SteVe");
      // simulate sending request & receiving response
      reporter.logScenario("StopTransaction", "Pass", request, response);
    } catch (err) {
      reporter.logScenario(
        "StopTransaction",
        "Fail",
        request,
        response,
        "No acknowledgment from SteVe"
      );
    }

    //await delay(3000);
  }
);

//----------------------------Reservation----------------------------------
When(
  "CP sends a ReserveNow request to CSMS to reserve the charger with an idTag {string}",
  async function (idTag) {
    lastResponse = await sendMessage("ReserveNow", {
      connectorId: 1,
      expiryDate: new Date(Date.now() + 10 * 60000).toISOString(), // 10 min from now
      idTag,
      parentIdTag: null,
      reservationId: 42,
    });
  }
);

const CSMS_API_BASE_URL = "http://localhost:3000/adminApi/chargers";
const chargepoint = "CP01";

//----------------------------CSMS OPerations---------------------------

// -------------------- RemoteStartTransaction --------------------
When(
  "The CSMS sends a RemoteStartTransaction request for connectorId {int} to the CP with idTag {string}",
  { timeout: 60 * 1000 },
  async function (connectorId, idTag) {
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/remotestart`;

    try {
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        idTag: idTag,
        connectorId: connectorId,
      });
      // Store the successful API response for later checks (if needed)
      // await sendConf();
      console.log("response=>>", response.data);
      this.ocppConfirmationPayload = response.data;
      console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      this.ocppError = error.response ? error.response.data : error;
      console.log(error);
      // throw new Error(
      //   `RemoteStart API failed: ${JSON.stringify(this.ocppError)}`
      // );
    }
  }
);

Then(
  "The CP should respond with a RemoteStartTransaction confirmation status of {string}",
  async function (expectedStatus) {
    // This step verifies that your CSMS successfully processed the CALLRESULT from the CP
    // and received the expected status (e.g., "Accepted").
    // const responseArray = Buffer.from(`[3,"${msg[1]}",{ "status": "Accepted"}]`)
    // 🔑 CRITICAL: Assert against the variable saved in the 'When' step
    if (
      !this.ocppConfirmationPayload ||
      this.ocppConfirmationPayload.status !== expectedStatus
    ) {
      throw new Error(
        `Expected status "${expectedStatus}" but received: ${JSON.stringify(
          this.ocppConfirmationPayload
        )}`
      );
    }
  }
);

// --- RemoteStopTransaction Scenario Steps ---
When(
  "The CSMS sends a RemoteStopTransaction request for connectorId {int} to the CP for the active transactionId",
  async function (connectorId) {
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
      console.log("response", response);
      this.ocppConfirmationPayload = response.data;
      console.log(this.ocppConfirmationPayload);
    } catch (error) {
      this.ocppError = error.response ? error.response.data : error;

      // Note: If the API sends a failure code (400/500), 'this.error' will be set.
      throw new Error(
        `RemoteStopTransaction API failed: ${JSON.stringify(error)}`
      );
    }
  }
);

Then(
  "The CP should respond with a RemoteStopTransaction confirmation status of {string}",
  async function (expectedStatus) {
    // This step verifies the CSMS received the CALLRESULT from the CP with "Accepted".
    if (
      !this.ocppConfirmationPayload ||
      this.ocppConfirmationPayload.status !== expectedStatus
    ) {
      throw new Error(
        `Expected status "${expectedStatus}" but received: ${JSON.stringify(
          this.ocppConfirmationPayload
        )}`
      );
    }
  }
);
