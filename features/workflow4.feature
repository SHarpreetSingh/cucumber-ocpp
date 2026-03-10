Feature: OCPP End-to-End Operational Lifecycle from Initial Bootup to Transaction Completion

Scenario: BootNotification
When CP sends a BootNotification request to CSMS to register the charger
Then CP should receive a BootNotification from CSMS with confirmation status "Accepted"

Scenario: SendLocalList
 When CSMS send a SendLocalList request with listVersion 1 to CP
 Then CP should receive a SendLocalList confirmation with status "Accepted" from CSMS

Scenario: getLocalListVersion
  When CSMS send a GetLocalListVersion request to CP
  Then CP should send the response to GetLocalListVersion with version number

Scenario: Authorize
 When CP send an Authorize request with idTag "TEST1234" to CSMS
 Then CP should receive an Authorize and confirmation status as "Accepted" from CSMS

Scenario: StartTransaction
 When CP send a StartTransaction request with idTag "TEST1234" and connectorId 1 to CSMS
 Then CP should receive a StartTransaction confirmation with transactionId from CSMS

Scenario: metervalues
 When CP send the MeterValues request for connector with transactionId to CSMS
  Then CP should receive an acknowledgment from CSMS

Scenario: ChangeConfiguration
 When CSMS send a ChangeConfiguration request to CP with key "HeartbeatInterval" and value 30

Scenario: StopTransaction
 When CP send a StopTransaction request with idTag "TEST1234" for that transaction to CSMS
    Then CP should receive a StopTransaction confirmation from CSMS

Scenario: StatusNotification
When CP send a StatusNotification request for connectorId 1 with status "Available" to CSMS
 Then CP should receive a StatusNotification confirmation from CSMS

 

 

 