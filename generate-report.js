const reporter = require('cucumber-html-reporter');
const fs = require('fs');

const reportJson = 'features/reports/report.json';
const jsonData = JSON.parse(fs.readFileSync(reportJson));

// Calculate compliance
const totalScenarios = jsonData.reduce((acc, feature) => acc + feature.elements.length, 0);
const passedScenarios = jsonData.reduce(
  (acc, feature) => acc + feature.elements.filter(e => e.steps.every(s => s.result.status === 'passed')).length,
  0
);
const compliance = ((passedScenarios / totalScenarios) * 100).toFixed(2);

const options = {
  name: "Ocpp-Testing",
  launchReport:true,
  theme: 'bootstrap',
  jsonFile: reportJson,
  output: 'features/reports/report.html',
  reportSuiteAsScenarios: true,
  metadata: {
    "Compliance": `<h1 style="font-size:30px; font-weight:bold; color:red;"> ${compliance}%</h1>`,
    "Platform": "Node.js"
  },
  displayDuration: true,
};

reporter.generate(options);
console.log(`Compliance score: ${compliance}%`);
