/*
# Add Telegram message templates to settings

1. Changes
- Adds a `telegram_message_templates` JSONB column to the `settings` table.
- Stores editable Telegram message templates for 5 reservation events:
  - `pensionRequest`: message sent when a pension reservation is submitted
  - `courtRequest`: message sent when a court reservation is submitted
  - `bbqRequest`: message sent when a BBQ package reservation is submitted
  - `pensionApproved`: message sent when a pension reservation is approved (예약완료)
  - `courtApproved`: message sent when a court/BBQ reservation is approved (예약완료)
- Each template supports placeholders: {userName}, {month}, {day}, {roomName}, {capacity}, {court}, {timeSlot}, {venue}
- Defaults to NULL so the app falls back to hardcoded messages until the admin sets custom templates.

2. Security
- No new tables. The settings table already has anon/authenticated CRUD policies.
- No RLS or policy changes needed.
*/

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS telegram_message_templates JSONB;
