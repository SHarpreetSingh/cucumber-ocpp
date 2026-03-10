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
const axios = require("axios");
const reporter = require("../../OCPP_reporter");
let ws;
let lastResponse;
let transactionId;
let totalScenarios = 0;
let passedScenarios = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Utility to send OCPP message
function sendMessage(action, payload = {}) {
  return new Promise((resolve, reject) => {
    const uniqueId = Date.now().toString();
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

// BeforeAll(async function () {
//   ws = new WebSocket("ws://localhost:3000/CP01", ["ocpp1.6"]);

//   await new Promise((resolve, reject) => {
//     ws.on("open", () => {
//       console.log("Connected to CSMS OCPP server.......");
//       resolve();
//     });

//     ws.on("error", reject);
//   });
//   await delay(3000);
// });

// After(function (scenario) {
//   totalScenarios++;

//   if (scenario.result.status === "PASSED") {
//     passedScenarios++;
//   }
// });

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
});
const CSMS_API_BASE_URL = "http://localhost:3000/adminApi/chargers";
const chargepoint = "CP01"; // ✅ Define your CP ID here
// -------------------- getConfiguration --------------------
When(
  "CSMS send a GetConfiguration request to CP",
  { timeout: 60 * 1000 },
  async function () {
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/getconfiguration`;

    try {
      console.log("url", url);
      // Send the HTTP request to your Express server
      lastResponse = await axios.post(url, {});
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      console.log("lastResponse", lastResponse);
      // this.ocppConfirmationPayload = lastResponse.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      // this.ocppError = null;
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

Then(
  "CP should send the response  to GetConfiguration according to the key",
  async function () {
    if (lastResponse.data.response.configurationKey) {
      reporter.logScenario("GetConfiguration", "Pass");
    } else {
      reporter.logScenario("GetConfiguration", "fail", "Invalid request");
    }
    t;
  }
);

// -------------------- changeConfiguration --------------------
When(
  "CSMS send a ChangeConfiguration request to CP with key {string} and value {int}",
  { timeout: 60 * 1000 },
  async function (key, value) {
    const messageName = "ChangeConfiguration";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/changeconfiguration`;

    try {
      console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        key: key,
        value: value,
      });
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      const response1 = { status: "Accepted" };
      if (response.data.response.status === response1.status) {
        reporter.logScenario(messageName, "Pass");
      } else {
        reporter.logScenario(messageName, "fail", "Invalid status");
      }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//------------------------ SendLocalList -----------------------------------------------
When(
  "CSMS send a SendLocalList request with listVersion {int} to CP",
  async function (listVersion) {
    const messageName = "SendLocalList";
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/send-local-list`;

    try {
      console.log("url", url);
      const response = await axios.post(url, {
        listVersion: listVersion,
      });

      const response1 = { status: "Accepted" };
      // if (response.data.response.status === response1.status) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response1.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//--------------------------------ReserveNow -----------------------------------------------

When(
  "CSMS send a reserveNow request to CP with connector ID {int} and expiry date {string} and idTag {string}",
  { timeout: 60 * 1000 },
  async function (connectorId, expiryDate, idTag) {
    const messageName = "ReserveNow";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/reserveNow`;

    try {
      console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        connectorId: connectorId,
        expiryDate: expiryDate,
        idTag: idTag,
      });
      // console.log("response", response.data.result);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      const response1 = { status: "Accepted" };
      if (response.data.result === response1) {
        reporter.logScenario(messageName, "Pass");
      } else {
        reporter.logScenario(messageName, "fail", "Invalid status");
      }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response1.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//--------------------------------cancelReservation -----------------------------------------------

When(
  "CSMS send a cancelReservation request with reservationId {int}",
  { timeout: 60 * 1000 },
  async function (reservationId) {
    const messageName = "cancelReservation";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/cancelReservation`;

    try {
      console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        // reservationId: reservationId,
      });
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//----------------------------------- GetLocalListVersion --------------------------------------------

When(
  "CSMS send a GetLocalListVersion request to CP",
  { timeout: 60 * 1000 },
  async function () {
    const messageName = "GetLocalListVersion";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/GetLocalListVersion`;

    try {
      // console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.get(url);
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//----------------------------------- setChargingProfile --------------------------------------------

When(
  "CSMS send a setChargingProfile request to CP with connector id {int}",
  { timeout: 60 * 1000 },
  async function (connectorid) {
    const messageName = "setChargingProfile";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/setChargingProfile`;
    const setChargingProfile = {
      csChargingProfiles: {
        chargingProfileId: 10,
        stackLevel: 0,
        chargingProfilePurpose: "TxProfile",
        chargingProfileKind: "Absolute",
        chargingSchedule: {
          chargingRateUnit: "A",
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      },
    };
    try {
      // console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        connectorId: connectorid,
        csChargingProfiles: setChargingProfile,
      });
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//------------------------------------ getCompositeSchedule---------------------------------------------

When(
  "CSMS send a getCompositeSchedule request to CP with connector id {int}",
  { timeout: 60 * 1000 },
  async function (connectorid) {
    const messageName = "getCompositeSchedule";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/getCompositeSchedule`;

    try {
      // console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        connectorId: connectorid,
        duration: 3600,
      });
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//------------------------------------ ClearChargingProfile---------------------------------------------

When(
  "CSMS send a ClearChargingProfile request to CP with connector id {int}",
  { timeout: 60 * 1000 },
  async function (connectorid) {
    const messageName = "ClearChargingProfile";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/ClearChargingProfile`;

    try {
      // console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        id: 10,
        connectorId: 1,
        chargingProfilePurpose: "TxProfile",
        stackLevel: 0,
      });
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);

//------------------------------------ ClearChargingProfile---------------------------------------------

When(
  "CSMS send a DataTransfer request to CP with vendor id {string} and message id {string}",
  { timeout: 60 * 1000 },
  async function (vendorId, messageId) {
    const messageName = "DataTransfer";
    // This step simulates your Express API being hit by the user/admin
    // and sending the WebSocket CALL message to the CP.
    const url = `${CSMS_API_BASE_URL}/${chargepoint}/dataTransfer`;

    try {
      // console.log("url", url);
      // Send the HTTP request to your Express server
      const response = await axios.post(url, {
        vendorId,
        messageId,
      });
      // console.log("response", response);
      // // Store the successful API response for later checks (if needed)
      // // await sendConf();
      // const response1 = { status: "Accepted" };
      // if (response.data.result === response1) {
      //   reporter.logScenario(messageName, "Pass");
      // } else {
      //   reporter.logScenario(messageName, "fail", "Invalid status");
      // }
      // // 🔑 CRITICAL: Store the CONFIRMATION PAYLOAD (e.g., { status: "Accepted" })
      this.ocppConfirmationPayload = response.data;
      // console.log("this.ocppConfirmationPayload", this.ocppConfirmationPayload);
      this.ocppError = null;
    } catch (error) {
      // Store the error if the server timed out or returned a 500
      console.log(error);
    }
  }
);
