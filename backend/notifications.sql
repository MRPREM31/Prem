-- Extend existing visitors table with subscription status and identifier columns
-- Run these statements in your Supabase SQL Editor to support visitor subscription analytics.

ALTER TABLE visitors ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS last_prompt_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS device_browser VARCHAR(255) DEFAULT NULL;
