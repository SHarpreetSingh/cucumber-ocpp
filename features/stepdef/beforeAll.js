const WebSocket = require("ws"); // ✅ Required in CommonJS
// const { delay } = require("./utils"); // if you use delay
const {
  handleGetConfiguration,
  handleChangeConfiguration,
} = require("./handleGetConfig");
ws = new WebSocket("ws://localhost:3000/CP01", ["ocpp1.6"]);
let message;
async function handleConnection() {
  await new Promise((resolve, reject) => {
    ws.on("open", () => {
      console.log("Connected to CSMS OCPP server.......");
      resolve();
    });

    ws.on("message", async (rawMessage) => {
      const message = JSON.parse(rawMessage.toString());
      const [messageType, messageId, action, payload] = message;
      console.log("message====>", message);
      // Handle CSMS → CP requests
      if (messageType === 2) {
        console.log(`📥 Received ${action} from CSMS`);

        switch (action) {
          case "GetConfiguration":
            handleGetConfiguration(message);
            console.log(`📤 Sent ChangeConfiguration.conf with status`);
            break;

          case "ChangeConfiguration":
            const status = handleChangeConfiguration(payload);
            const responseayload = [3, messageId, { status }];
            ws.send(JSON.stringify(responseayload));
            console.log(
              `📤 Sent ChangeConfiguration.conf with status=${status}`
            );
            break;

          case "RemoteStartTransaction":
            console.log(
              `[CP] Received RemoteStartTransaction.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn));
            console.log(`[CP] Sent RemoteStartTransaction.conf`);
            break;

          case "RemoteStopTransaction":
            console.log(
              `[CP] Received RemoteStopTransaction.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn1 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn1));
            console.log(`[CP] Sent RemoteStopTransaction.conf`);
            break;

          case "SendLocalList":
            console.log(
              `[CP] Received SendLocalList.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn2 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn2));
            console.log(`[CP] Sent RemoteStopTransaction.conf`);
            break;

          case "ReserveNow":
            console.log(
              `[CP] Received ReserveNow.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn4 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn4));
            console.log(`[CP] Sent ReserveNow.conf`);
            break;

          case "CancelReservation":
            console.log(
              `[CP] Received CancelReservation.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn5 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn5));
            console.log(`[CP] Sent CancelReservation.conf`);
            break;

          case "GetLocalListVersion":
            console.log(
              `[CP] Received GetLocalListVersion.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn6 = [3, messageId, { listVersion: 4 }];
            ws.send(JSON.stringify(confrmtn6));
            console.log(`[CP] Sent GetLocalListVersion.conf`);
            break;

          case "SetChargingProfile":
            console.log(
              `[CP] Received SetChargingProfile.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn7 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn7));
            console.log(`[CP] Sent SetChargingProfile.conf`);
            break;

          case "GetCompositeSchedule":
            console.log(
              `[CP] Received SetChargingProfile.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn8 = [
              3,
              messageId,
              {
                status: "Accepted",
                connectorId: 1,
                scheduleStart: "timestamp",
                chargingSchedule: {
                  duration: 3600,
                  startSchedule: "2025-12-03T17:10:00Z",
                  chargingRateUnit: "A",
                  chargingSchedulePeriod: [
                    {
                      startPeriod: 0,
                      limit: 16,
                      numberPhases: 3,
                    },
                    {
                      startPeriod: 1800,
                      limit: 6,
                      numberPhases: 3,
                    },
                  ],
                  minChargingRate: 5,
                },
              },
            ];
            ws.send(JSON.stringify(confrmtn8));
            console.log(`[CP] Sent SetChargingProfile.conf`);
            break;

          case "ClearChargingProfile":
            console.log(
              `[CP] Received ClearChargingProfile.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn9 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn9));
            console.log(`[CP] Sent ClearChargingProfile.conf`);
            break;

          case "DataTransfer":
            console.log(
              `[CP] Received DataTransfer.req (ID: ${messageId}) - RESPONDING NOW`
            );
            const confrmtn10 = [3, messageId, { status: "Accepted" }];
            ws.send(JSON.stringify(confrmtn10));
            console.log(`[CP] Sent DataTransfer.conf`);
            break;

          default:
            console.log(`⚠️ Unsupported action received: ${action}`);
        }
      }
    });

    ws.on("error", reject);
  });

  // Utility to send OCPP message

  // await delay(3000);
}

function sendMessage(action, payload = {}) {
  return new Promise((resolve, reject) => {
    const uniqueId = Date.now().toString();
    const message = [4, uniqueId, action, payload];
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
      resolve({ request: message, response: data });
    });
  });
}

// Send a "CallResult" response back to the Charge Point
async function sendResult(messageId, payload) {
  console.log("payload=========>>>>>>>", payload);
  const response = [3, messageId, payload];
  if (payload.status == "Rejected") {
    console.error(`Rejected response :${response}`);
  }
  //   logger.info(`CS -> CP : ${JSON.stringify(response)}`);
  // console.info("sendResult", response);
  this.ws.send(JSON.stringify(response));
}
module.exports = { handleConnection, sendMessage, sendResult };
