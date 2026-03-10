Feature: OCPP Reservation Management and Charging Slot Allocation

Scenario: ReserveNow
When CSMS send a reserveNow request to CP with connector ID 1 and expiry date "2026-01-15T00:00:00.000Z" and idTag "TEST1234"

Scenario: cancelReservation
When CSMS send a cancelReservation request with reservationId 19092