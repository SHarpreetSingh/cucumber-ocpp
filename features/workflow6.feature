Feature: OCPP Smart Charging management and Vendor-Specific data exchange between CP and CSMS

Scenario: setChargingProfile
When CSMS send a setChargingProfile request to CP with connector id 01

Scenario: getCompositeSchedule
When CSMS send a getCompositeSchedule request to CP with connector id 01

Scenario: ClearChargingProfile
When CSMS send a ClearChargingProfile request to CP with connector id 01

Scenario: getCompositeSchedule
When CSMS send a getCompositeSchedule request to CP with connector id 01

Scenario: DataTransfer
When CSMS send a DataTransfer request to CP with vendor id "ABC" and message id "1234"