-- Migration for AI Features

-- 1. Add summary, tasks, and suggestions to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]'::jsonb;
