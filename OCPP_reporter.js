const fs = require("fs");
const path = require("path");

// Array to collect scenario logs
let reportData = [];

/**
 * Add a row to the report
 * @param {string} message - OCPP message name or description
 * @param {string} result - Pass / Fail
 * @param {string} reason - Reason for fail or extra info
 * @param {object|string} [request] - Request payload
 * @param {object|string} [response] - Response payload
 */
function logScenario(
  message,
  result,
  request = "",
  response = "",
  reason = ""
) {
  reportData.push({ message, result, request, response, reason });
}

/**
 * Generate the HTML report and save to folder
 * @param {string} folderPath - Path to save report
 * @returns {string} The path to the generated report file.
 */
function generateHTMLReport(folderPath = "./reports") {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\..+/, "");

  const filePath = path.join(folderPath, `OCPP_Report_${timestamp}.html`);

  // Compute summary stats
  const total = reportData.length;
  const passed = reportData.filter(
    (r) => r.result.toLowerCase() === "pass"
  ).length;
  const failed = total - passed;
  const compliance = total ? ((passed / total) * 100).toFixed(1) : 0;

  // Build HTML content
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>OCPP Compliance Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h2 { color: #333; }
      p.summary { background: #f4f4f4; padding: 10px; border-radius: 8px; }
      table { border-collapse: collapse; width: 100%; margin-top: 15px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #4CAF50; color: white; cursor: default; }
      tr:nth-child(even){background-color: #f9f9f9;}
      tr.fail { background-color: #f8d7da; }
      tr.pass { background-color: #d4edda; }
      .details {
        display: none;
        background-color: #f9f9f9;
        border-left: 3px solid #ccc;
        padding: 10px;
        margin: 10px 0;
      }
      .message-cell {
        color: #007bff;
        cursor: pointer;
        text-decoration: underline;
      }
      pre {
        background: #f0f0f0;
        padding: 10px;
        border-radius: 6px;
        overflow-x: auto;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <h2>OCPP Compliance Test Report</h2>
    <p class="summary">
      <strong>Total:</strong> ${total} &nbsp;|&nbsp;
      <strong>Passed:</strong> ${passed} &nbsp;|&nbsp;
      <strong>Failed:</strong> ${failed} &nbsp;|&nbsp;
      <strong>Compliance:</strong> ${compliance}%
    </p>
    <table>
      <tr>
        <th>OCPP Message</th>
        <th>Result</th>
        <th>Reason</th>
      </tr>`;

  reportData.forEach((row, index) => {
    const req =
      typeof row.request === "object"
        ? JSON.stringify(row.request, null, 2)
        : row.request;
    const res =
      typeof row.response === "object"
        ? JSON.stringify(row.response, null, 2)
        : row.response;

    html += `
      <tr class="${row.result.toLowerCase()}">
        <td class="message-cell" onclick="toggleDetails('details-${index}')">${
      row.message
    }</td>
        <td>${row.result}</td>
        <td>${row.reason}</td>
      </tr>
      <tr id="details-${index}" class="details-row">
        <td colspan="3">
          <div class="details">
            <strong>Request:</strong>
            <pre>${req || "—"}</pre>
            <strong>Response:</strong>
            <pre>${res || "—"}</pre>
          </div>
        </td>
      </tr>`;
  });

  html += `
    </table>

    <script>
      // Accordion behavior: only one open at a time
      function toggleDetails(id) {
        document.querySelectorAll('.details').forEach(el => {
          if (el.parentElement.parentElement.id !== id) {
            el.style.display = 'none';
          }
        });
        const row = document.getElementById(id);
        const detailDiv = row.querySelector('.details');
        detailDiv.style.display = detailDiv.style.display === 'block' ? 'none' : 'block';
      }

      // Auto-scroll to bottom
      window.onload = () => {
        window.scrollTo(0, document.body.scrollHeight);
      };
    </script>
  </body>
  </html>`;

  fs.writeFileSync(filePath, html, "utf-8");
  console.log(`📊 HTML report generated at: ${filePath}`);
  return filePath;
}

/**
 * Clear previous logs
 */
function clearReport() {
  reportData = [];
}

// Export the functions using CommonJS syntax
module.exports = {
  logScenario,
  generateHTMLReport,
  clearReport,
};
