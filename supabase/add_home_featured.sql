-- Add is_home_featured column to photos table
ALTER TABLE photos ADD COLUMN is_home_featured boolean DEFAULT false;

-- Create index for faster queries on featured photos
CREATE INDEX idx_photos_home_featured ON photos(is_home_featured);
