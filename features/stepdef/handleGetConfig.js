// handleGetConfiguration.js

// const { sendResult } = require("./beforeAll");

/**
 * Example Configuration Store for the Charge Point
 */
const configurationStore = {
  AuthorizeRemoteTxRequests: { value: "true", readonly: false },
  HeartbeatInterval: { value: "60", readonly: false },
  LocalPreAuthorize: { value: "false", readonly: true },
  GetConfigurationMaxKeys: { value: "10", readonly: true },
};

/**
 * Handle GetConfiguration.req logic
 * @param {Object} payload - Payload from CSMS
 * @returns {Object} - Response payload (for OCPP CallResult)
 */
async function handleGetConfiguration(message) {
  const [messageType, messageId, action, payload = {}] = message;
  let requestedKeys = [];

  // Normalize various key formats
  if (!payload.key) {
    requestedKeys = [];
  } else if (Array.isArray(payload.key)) {
    requestedKeys = payload.key;
  } else if (typeof payload.key === "object" && payload.key.key) {
    requestedKeys = [payload.key.key];
  } else if (typeof payload.key === "string") {
    requestedKeys = [payload.key];
  }

  const configurationKey = [];
  const unknownKey = [];

  // No keys → return all
  if (requestedKeys.length === 0) {
    for (const [key, { value, readonly }] of Object.entries(
      configurationStore
    )) {
      configurationKey.push({ key, readonly, value });
    }
    return { configurationKey };
  }

  // Process requested keys
  for (const key of requestedKeys) {
    if (configurationStore.hasOwnProperty(key)) {
      const { value, readonly } = configurationStore[key];
      configurationKey.push({ key, readonly, value });
    } else {
      unknownKey.push(key);
    }
  }

  const response = {};
  if (configurationKey.length > 0) response.configurationKey = configurationKey;
  if (unknownKey.length > 0) response.unknownKey = unknownKey;
  console.log("response", response);
  await sendResult(messageId, response);
  // return response;
}

function handleChangeConfiguration(payload) {
  let currentConfig = {
    HeartbeatInterval: "30",
    MeterValueSampleInterval: "15",
  };
  const supportedConfigs = {
    HeartbeatInterval: {
      validate: (value) => {
        const num = Number(value);
        return Number.isInteger(num) && num >= 10 && num <= 3600;
      },
      rebootRequired: false,
    },
    MeterValueSampleInterval: {
      validate: (value) => {
        const num = Number(value);
        return Number.isInteger(num) && num >= 1 && num <= 3600;
      },
      rebootRequired: true, // needs reboot
    },
  };
  try {
    const { key, value } = payload;
    console.log(
      `⚙️ Received ChangeConfiguration for key=${key}, value=${value}`
    );

    let status = "Rejected"; // default

    // 1️⃣ Unknown key
    if (!supportedConfigs[key]) {
      status = "NotSupported";
    }
    // 2️⃣ Invalid value
    else if (!supportedConfigs[key].validate(value)) {
      status = "Rejected";
    }
    // 3️⃣ Valid value
    else {
      currentConfig[key] = value; // update locally
      status = supportedConfigs[key].rebootRequired
        ? "RebootRequired"
        : "Accepted";
    }

    return status;
    // Send response back to CSMS
  } catch (error) {
    console.log(error);
  }
}
module.exports = { handleGetConfiguration, handleChangeConfiguration };
