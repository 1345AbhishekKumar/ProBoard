-- Migration for Organization Features

-- 1. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#475569',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create note_tags table for many-to-many relationship
CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (note_id, tag_id)
);

-- 3. Add folder_id to notes (Optional, if moving away from folder_name)
-- ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;

-- 4. Add new columns to user_settings for view preferences
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS view_mode TEXT DEFAULT 'canvas';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sort_by TEXT DEFAULT 'manual';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS active_filters JSONB DEFAULT '{"color": "all", "tags": [], "date": "all"}'::jsonb;

-- 5. Add tags column to notes (Since we are storing tags as JSONB array of strings for simplicity)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
