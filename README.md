*# 🧪 cucumber-ocpp*
 
An automated testing framework for ***OCPP (Open Charge Point Protocol)*** built with ***Node.js*** and ***Cucumber.js***.*
This project enables simulation and testing of **EVSE (Charging Station)*** and ***CSMS (Central System)** *message exchanges, including firmware management, diagnostics, and transaction flows.*
 
---
 
## 📘 Overview
 
This repository is designed to:
- Test **OCPP 1.6/2.0.1*** message flows using BDD (Behavior-Driven Development).
- Use ***Cucumber.js*** feature files to describe expected OCPP behaviors.
- Simulate both ***Charge Point (CP)*** and ***Central System (CSMS)** *via WebSocket.*
- Validate firmware management, diagnostics, and remote transaction operations.
 
---
 
## ⚙️ Tech Stack
 
| Component | Description |
|------------|-------------|
| **Node.js*** | JavaScript runtime for backend logic |
| ***Cucumber.js*** | BDD testing framework |
| ***WebSocket (ws)*** | For OCPP communication between CP and CSMS |
| ***OCPP Core & Firmware Management*** | Custom modules implementing message schemas and responses |
| ***Mocha/Chai (optional)** *| Used in some test utilities for assertions |*
 
---
 
## 📂 Project Structure
 
 
---
 
## 🚀 Getting Started
 
### 1️⃣ Clone the Repository*
```bash
git clone https://github.com/SHarpreetSingh/cucumber-ocpp.git
cd cucumber-ocpp
 
npm install
 
npx cucumber-js features/<feature name>
