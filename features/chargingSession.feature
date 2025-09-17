Feature: OCPP basic workflow of charge point(CP) and central system(CSMS) from bootup to charging cycle

  Scenario: BootNotification
    When CP sends a BootNotification request to CSMS to register the charger
    Then CP should receive a BootNotification from CSMS with confirmation status "Accepted"

  Scenario: Heartbeat
    When CP sends a Heartbeat request to CSMS
    Then CP should receive a Heartbeat acknowledgment with the current time from CSMS

  Scenario: Authorize
    When CP send an Authorize request with idTag "TEST1234" to CSMS
    Then CP should receive an Authorize and confirmation status as "Accepted" from CSMS

  Scenario: StatusNotification
    When CP send a StatusNotification request for connectorId 1 with status "Available" to CSMS
    Then CP should receive a StatusNotification confirmation from CSMS

  Scenario: StartTransaction
    When CP send a StartTransaction request with idTag "TEST1234" and connectorId 1 to CSMS
    Then CP should receive a StartTransaction confirmation with transactionId from CSMS

  Scenario: MeterValues
    When CP send the MeterValues request for connector with transactionId to CSMS
    Then CP should receive an acknowledgment from CSMS

  Scenario: StopTransaction
    When CP send a StopTransaction request with idTag "TEST1234" for that transaction to CSMS
    Then CP should receive a StopTransaction confirmation from CSMS
