-- Migration for Sync & Data Features

-- 1. Create note_versions table
CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own note versions"
  ON note_versions
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Create a trigger to automatically insert note versions
CREATE OR REPLACE FUNCTION log_note_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if content has changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.content IS DISTINCT FROM OLD.content) THEN
    INSERT INTO note_versions (note_id, user_id, content, updated_at)
    VALUES (NEW.id, NEW.user_id, NEW.content, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS note_versions_trigger ON notes;
CREATE TRIGGER note_versions_trigger
  AFTER INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_note_version();

-- 4. Enable realtime for notes
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = 'notes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE notes;
    END IF;
  END
  $$;
COMMIT;
