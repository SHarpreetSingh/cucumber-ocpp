Feature: OCPP  Health Monitoring, and Configuration Management

Scenario: Heartbeat
 When CP sends a Heartbeat request to CSMS
 Then CP should receive a Heartbeat acknowledgment with the current time from CSMS

Scenario: StatusNotification
 When CP send a StatusNotification request for connectorId 1 with status "Available" to CSMS
 Then CP should receive a StatusNotification confirmation from CSMS

Scenario: GetConfiguration
 When CSMS send a GetConfiguration request to CP
 Then CP should send the response  to GetConfiguration according to the key

Scenario: ChangeConfiguration
 When CSMS send a ChangeConfiguration request to CP with key "HeartbeatInterval" and value 30
