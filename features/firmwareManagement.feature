Feature: OCPP 1.6 Firmware Management Flow
    The Charge Point must correctly handle firmware updates and diagnostics
    according to the OCPP 1.6 Firmware Management Profile.

    Scenario: Diagnostics file upload flow
        When the CSMS sends a GetDiagnostics request with:
            | location  | http://localhost:3000/adminApi/upload/logs |
            | startTime | 2025-09-08T12:00:00Z                       |
            | stopTime  | 2025-09-08T12:15:00Z                       |
        Then the CP successfully uploads a file to "http://localhost:3000/adminApi/upload/logs" and reports status

Scenario: Firmware update flow
    When the CSMS sends an UpdateFirmware request with:
        | location     | http://192.168.0.165:9000/firmware/latest.bin |
        | retrieveDate | 2025-09-08T12:20:00Z                          |
Then the CP should respond with UpdateFirmware status "Accepted"
Then the CP should send FirmwareStatusNotification with status "Downloading"
Then the CP should send FirmwareStatusNotification with status "Downloaded"
Then the CP should send FirmwareStatusNotification with status "Installing"
Then the CP should send FirmwareStatusNotification with status "Installed"
