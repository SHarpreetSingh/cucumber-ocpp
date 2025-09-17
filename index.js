// import WebSocket from "ws";
const WebSocket = require('ws');


// const ws = new WebSocket("ws://192.168.0.132:8180/steve/websocket/CentralSystemService/CP01");

const ws = new WebSocket(
  `ws://192.168.0.132:8180/steve/websocket/CentralSystemService/CP01`,
  ["ocpp1.6"]   // important: must pass OCPP subprotocol
);


ws.on("open", () => {
  console.log("Connected to STEVE");

  // Send BootNotification
  ws.send(JSON.stringify([
    2, "12345", "BootNotification", {
      chargePointModel: "SimModel",
      chargePointVendor: "SimVendor"
    }
  ]));
});

ws.on("message", (msg) => {
  console.log("Received:", msg);

  // Example: Respond to CentralSystem Call
//   const parsed = JSON.parse(msg);
//   if (parsed[0] === 2 && parsed[2] === "RemoteStartTransaction") {
//     ws.send(JSON.stringify([3, parsed[1], { status: "Accepted" }]));
//   }

const messageStr = msg.toString();

  console.log("Received (string):", messageStr);

  try {
    // Parse JSON if it's valid
    const parsed = JSON.parse(messageStr);
    console.log("Received (parsed):", parsed);
  } catch (err) {
    console.error("Not JSON:", err);
  }
  
});

ws.on("error", (msg) => {
  console.log("Received err:::", msg);
  
});
