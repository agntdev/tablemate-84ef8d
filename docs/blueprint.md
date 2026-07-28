# TableReserve Bot — Bot specification

**Archetype:** booking

**Voice:** friendly and concise — write every user-facing message, button label, error, and empty state in this voice.

A restaurant reservation bot that lets guests book tables by selecting date, time, and party size. It shows only genuinely available slots based on configured tables, opening hours, and sittings. Guests receive confirmation codes, reminders, and can reschedule/cancel via buttons. Owners get admin views for bookings, capacity tracking, and no-show flags.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- restaurant guests
- restaurant owners

## Success criteria

- Guests can book tables with real-time availability
- Owners receive booking alerts and capacity summaries
- Reservations are automatically reminded and can be rescheduled/canceled

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu with booking options
- **Book a table** (button, actor: user, callback: booking:start) — Initiates the table booking flow
- **/admin** (command, actor: owner, command: /admin) — Opens admin menu for owners to view bookings and capacity
- **Upcoming bookings** (button, actor: owner, callback: admin:bookings) — Shows owner's upcoming reservations
- **Today's remaining capacity** (button, actor: owner, callback: admin:capacity) — Displays available table slots for today

## Flows

### Guest booking flow
_Trigger:_ /start or 'Book a table' button

1. Show main menu
2. Select date
3. Choose available time slot
4. Enter party size
5. Optional name/contact
6. Confirm booking

_Data touched:_ Booking, Table types, Sitting

### Admin view flow
_Trigger:_ /admin or admin buttons

1. Show admin menu
2. Display upcoming bookings
3. Show today's capacity summary

_Data touched:_ Booking, Table types, Sitting

### Reschedule/cancel flow
_Trigger:_ Reschedule or Cancel buttons on booking confirmation

1. Show reschedule/cancel options
2. Select new date/time or confirm cancellation
3. Update booking status

_Data touched:_ Booking

### Reminder flow
_Trigger:_ Automated reminder schedule

1. Send reminder message
2. Include reschedule/cancel buttons

_Data touched:_ Booking

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Table types** _(retention: persistent)_ — Different table sizes and their capacities
  - fields: table_type, number_of_tables, seats_per_table, total_seats
- **Sitting** _(retention: persistent)_ — Restaurant operating hours and booking duration
  - fields: weekday, opening_hour, closing_hour, sitting_duration
- **Booking** _(retention: persistent)_ — Guest reservations with status tracking
  - fields: guest_name, party_size, booking_date, booking_time, table_allocation, reference_code, status
- **Reminder schedule** _(retention: persistent)_ — When to send automated reminders
  - fields: hours_before

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure table types and capacities
- Set opening hours and sitting duration
- Adjust reminder timing
- View upcoming bookings
- Mark bookings as no-show

## Notifications

- Guest confirmation messages
- Guest reminders with reschedule/cancel buttons
- Admin booking alerts
- Admin daily capacity summaries

## Permissions & privacy

- Guest data is private and only visible to owner
- No public sharing of guest contact details
- Bookings are stored securely

## Edge cases

- Guest tries to book during closed hours
- Guest requests party size larger than available
- Multiple simultaneous booking attempts for same slot
- Owner tries to edit a canceled booking

## Required tests

- End-to-end booking flow with availability checks
- Admin view displays correct capacity
- Reminder messages trigger with correct timing
- Reschedule/cancel updates availability in real-time

## Assumptions

- Owner provides their Telegram ID for admin notifications
- Default sitting duration is 90 minutes
- Default opening hours are 11:00-22:00 weekdays, 11:00-23:00 weekends
