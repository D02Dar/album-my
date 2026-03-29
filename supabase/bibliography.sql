-- Create bibliography table
CREATE TABLE IF NOT EXISTS bibliography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  publish_year TEXT,
  publisher TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bibliography_publish_year ON bibliography(publish_year DESC);
CREATE INDEX IF NOT EXISTS idx_bibliography_created_at ON bibliography(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE bibliography ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow public read access" ON bibliography;
CREATE POLICY "Allow public read access"
  ON bibliography
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON bibliography;
CREATE POLICY "Allow authenticated insert"
  ON bibliography
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON bibliography;
CREATE POLICY "Allow authenticated delete"
  ON bibliography
  FOR DELETE
  USING (true);

-- Create storage bucket for bibliography covers (if not exists)
-- Note: The bucket must be created via Supabase UI and set to PUBLIC

-- RLS policies for storage bucket
-- These ensure public read access and authenticated write/delete access

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bibliography_covers');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bibliography_covers' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bibliography_covers' AND auth.role() = 'authenticated'
  );
