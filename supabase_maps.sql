-- Create providers table for storing medical places from Google Maps
CREATE TABLE IF NOT EXISTS providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT CHECK (type IN ('doctor', 'lab', 'pharmacy', 'hospital', 'other')),
  rating FLOAT,
  phone_number TEXT,
  location JSONB, -- Storing lat/lng as JSON { "lat": 123, "lng": 456 }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read providers (since they are public info from Maps)
CREATE POLICY "Public read access for providers" ON providers
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert providers (when linking)
CREATE POLICY "Authenticated users can insert providers" ON providers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add provider_id to reports (Linking a report to a doctor/lab)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;

-- Create prescriptions table if it doesn't exist (Handling missing relation error)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT,
  file_name TEXT,
  doctor_name TEXT, -- Legacy field, can be replaced by provider_id later
  date_issued DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL
);

-- Enable RLS for prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Policy for prescriptions (Users can own their data)
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions" ON prescriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add provider_id to reports (Linking a report to a doctor/lab)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;


-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_google_place_id ON providers(google_place_id);
