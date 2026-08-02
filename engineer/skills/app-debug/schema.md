# Table Schema Reference

## `bots`
`id` PK, `workspace_id` FK, `name`, `handle` (URL slug), `ai_model` (nullable), `response_mode`

## `chat_conversations`
`id` PK, `conversation_id` (UUID), `display_number` (URL #NNNN), `bot_id` FK, `status` (0=open 1=closed), `source`, `response_mode`, `message_count`, `metrics` json, `metadata` json (lead_data), `last_message_at`, `is_important`, `is_spam`, `unread_count`

No `csat_score` column. CSAT is in `chat_messages.metadata` JSON.

## `chat_messages`
`id` PK, `chat_conversation_id` FK→chat_conversations.id, `sender_type` (user/bot/admin), `sender_id`, `content`, `content_type`, `source`, `is_admin_reply`, `is_finish`, `duration` (ms), `metadata` json, `created_at`

metadata JSON paths: `$.sentiment.satisfaction` (CSAT 1-5), `$.analysis.labels.topics` (array), `$.analysis.customer.satisfaction`

## `chat_conversation_histories` (audit log, NOT messages)
`id` PK, `history_id` UUID, **`conversation_id`** FK→chat_conversations.id, `user_id`, `action`, `field_name`, `old_value`, `new_value`, `note`, `created_at`

WARNING: FK is `conversation_id`, NOT `chat_conversation_id`.

## `api_logs`
`id` PK, `chat_conversation_id` FK, `bot_id` FK, `status` (success/error), `model`, `endpoint`, `stage` (chat/label/summary), `duration` (ms), `prompt_tokens`, `completion_tokens`, `total_tokens`, `payload` json, `response` json, `tools` json, `created_at`

## Relationships
```
bots.handle → bots.id
  └─► chat_conversations.bot_id + display_number → chat_conversations.id
        ├─► chat_messages.chat_conversation_id
        ├─► api_logs.chat_conversation_id
        └─► chat_conversation_histories.conversation_id (NOT chat_conversation_id!)
```
