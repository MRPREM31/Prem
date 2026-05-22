-- SQL Schema for Maintenance Mode System
-- Run this in your Supabase SQL Editor to create the required table and seed default settings

CREATE TABLE IF NOT EXISTS maintenance_settings (
  id INT PRIMARY KEY,
  maintenance_enabled BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial configuration row if it doesn't exist
INSERT INTO maintenance_settings (id, maintenance_enabled, message)
VALUES (1, FALSE, 'Sorry for the inconvenience. The portfolio is currently under maintenance and will automatically resume once the upgrade is completed.')
ON CONFLICT (id) DO NOTHING;
