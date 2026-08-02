# DB Query Templates

Run via: `bash .claude/scripts/db-{env}-query.sh "{SQL}"`

## Find conversation

```sql
SELECT c.id, c.conversation_id, c.display_number, c.status, c.source, c.response_mode,
       c.message_count, c.created_at, c.last_message_at,
       b.id AS bot_id, b.name AS bot_name, b.ai_model
FROM chat_conversations c
JOIN bots b ON b.id = c.bot_id
WHERE b.handle = '{bot_handle}' AND c.display_number = {display_number}
LIMIT 1;
```

## Get messages

```sql
SELECT id, sender_type, content, source, is_admin_reply, duration, created_at
FROM chat_messages
WHERE chat_conversation_id = {conv_id}
ORDER BY created_at ASC LIMIT 50;
```

## Get API logs

```sql
SELECT id, status, model, stage, duration,
       prompt_tokens, completion_tokens, total_tokens,
       SUBSTRING(payload, 1, 500) AS payload_preview,
       SUBSTRING(response, 1, 500) AS response_preview, created_at
FROM api_logs
WHERE chat_conversation_id = {conv_id}
ORDER BY created_at ASC LIMIT 20;
```

Full payload: `SELECT payload, response FROM api_logs WHERE id = {log_id};`

## Recent errors (no conversation context)

```sql
SELECT id, status, model, endpoint, stage, duration,
       SUBSTRING(response, 1, 500) AS error_response, created_at
FROM api_logs WHERE status = 'error' ORDER BY created_at DESC LIMIT 10;
```

## CSAT scores

```sql
SELECT id, SUBSTRING(content, 1, 50) AS msg,
       JSON_EXTRACT(metadata, '$.sentiment.satisfaction') AS csat
FROM chat_messages
WHERE chat_conversation_id = {conv_id} AND sender_type = 'user'
ORDER BY created_at ASC;
```
