
Feature: OCPP Remote Control and Transaction Management from CSMS to Charge Point

    Scenario: RemoteStartTransaction
        When The CSMS sends a RemoteStartTransaction request for connectorId 1 to the CP with idTag "TEST1234"
        Then The CP should respond with a RemoteStartTransaction confirmation status of "Accepted"

    Scenario: Authorize
        When CP send an Authorize request with idTag "TEST1234" to CSMS
        Then CP should receive an Authorize and confirmation status as "Accepted" from CSMS

    Scenario: StatusNotification
        When CP send a StatusNotification request for connectorId 1 with status "Preparing" to CSMS
        Then CP should receive a StatusNotification confirmation from CSMS

    Scenario: StartTransaction
        When CP send a StartTransaction request with idTag "TEST1234" and connectorId 2 to CSMS
        Then CP should receive a StartTransaction confirmation with transactionId from CSMS

    Scenario: StatusNotification
        When CP send a StatusNotification request for connectorId 1 with status "Charging" to CSMS
        Then CP should receive a StatusNotification confirmation from CSMS

    Scenario: RemoteStopTransaction
        When The CSMS sends a RemoteStopTransaction request for connectorId 1 to the CP for the active transactionId
        Then The CP should respond with a RemoteStopTransaction confirmation status of "Accepted"

    Scenario: StatusNotification
        When CP send a StatusNotification request for connectorId 2 with status "Charging" to CSMS
        Then CP should receive a StatusNotification confirmation from CSMS

    Scenario: StopTransaction
        When CP send a StopTransaction request with idTag "TEST1234" for that transaction to CSMS
        Then CP should receive a StopTransaction confirmation from CSMS

    Scenario: StatusNotification
        When CP send a StatusNotification request for connectorId 1 with status "Available" to CSMS
        Then CP should receive a StatusNotification confirmation from CSMS