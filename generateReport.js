const fs = require("fs");
const path = require("path");

const reportPath = path.join(__dirname, "reports/cucumber_report.json");
const outputPath = path.join(__dirname, "reports/compliance_report.html");

// Read cucumber JSON report
const reportData = JSON.parse(fs.readFileSync(reportPath, "utf8"));

// Group results by device (feature file)
const deviceResults = {};
reportData.forEach((feature) => {
  const deviceName = path.basename(feature.uri, ".feature"); // device1, device2...
  let total = 0,
    passed = 0;

  feature.elements.forEach((scenario) => {
    scenario.steps.forEach((step) => {
      total++;
      if (step.result.status === "passed") {
        passed++;
      }
    });
  });

  const compliance = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
  deviceResults[deviceName] = compliance;
});

// Generate HTML report
let html = `
<!DOCTYPE html>
<html>
<head>
  <title>OCPP 1.6 Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .device { margin-bottom: 20px; }
    .progress-bar {
      width: 100%;
      background: #eee;
      border-radius: 8px;
      margin: 10px 0;
    }
    .progress {
      height: 24px;
      border-radius: 8px;
      text-align: center;
      color: white;
      line-height: 24px;
    }
    .green { background: green; }
    .orange { background: orange; }
    .red { background: red; }
  </style>
</head>
<body>
  <h1>OCPP 1.6 Compliance Report</h1>
`;

// Add devices dynamically
for (const [device, compliance] of Object.entries(deviceResults)) {
  let color = "red";
  if (compliance >= 90) color = "green";
  else if (compliance >= 70) color = "orange";

  html += `
    <div class="device">
      <h2>${device}</h2>
      <div class="progress-bar">
        <div class="progress ${color}" style="width:${compliance}%">${compliance}% Compliance</div>
      </div>
    </div>
  `;
}

html += `
</body>
</html>
`;

// Write HTML file
fs.writeFileSync(outputPath, html, "utf8");
console.log("✅ Compliance report generated:", outputPath);
