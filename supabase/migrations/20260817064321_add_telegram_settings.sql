/*
# Add Telegram bot token and chat ID to settings

- telegram_bot_token (text, nullable): Telegram Bot API token
- telegram_chat_id (text, nullable): target chat/channel ID to send notifications to
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;
