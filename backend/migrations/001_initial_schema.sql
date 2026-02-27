-- ============================================================
-- Acme Lease Processor — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension (should already be enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: lease_uploads
-- Tracks each uploaded lease file and its processing status
-- ============================================================
CREATE TABLE IF NOT EXISTS lease_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'extracting', 'extracted', 'generating', 'complete', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: extracted_data
-- Stores the 14 fields extracted from each lease by AI
-- ============================================================
CREATE TABLE IF NOT EXISTS extracted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_upload_id UUID NOT NULL UNIQUE REFERENCES lease_uploads(id) ON DELETE CASCADE,
    tenant_name TEXT,
    property_address TEXT,
    lease_start_date TEXT,
    lease_end_date TEXT,
    rent_amount TEXT,
    bond_amount TEXT,
    num_occupants TEXT,
    pet_permission TEXT,
    parking TEXT,
    special_conditions TEXT,  -- NULL means no special conditions (omit section from Welcome Pack)
    landlord_name TEXT,
    property_manager_name TEXT,
    property_manager_email TEXT,
    property_manager_phone TEXT,
    raw_ai_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: welcome_packs
-- Tracks generated Welcome Pack .docx files
-- ============================================================
CREATE TABLE IF NOT EXISTS welcome_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_upload_id UUID NOT NULL UNIQUE REFERENCES lease_uploads(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lease_uploads_user_id ON lease_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_lease_uploads_created_at ON lease_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_data_lease_upload_id ON extracted_data(lease_upload_id);
CREATE INDEX IF NOT EXISTS idx_welcome_packs_lease_upload_id ON welcome_packs(lease_upload_id);

-- ============================================================
-- Updated_at trigger for lease_uploads
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lease_uploads_updated_at
    BEFORE UPDATE ON lease_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE lease_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_packs ENABLE ROW LEVEL SECURITY;

-- lease_uploads: users can only access their own uploads
CREATE POLICY "Users can view own uploads"
    ON lease_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
    ON lease_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
    ON lease_uploads FOR UPDATE
    USING (auth.uid() = user_id);

-- extracted_data: users can access via their lease_uploads
CREATE POLICY "Users can view own extracted data"
    ON extracted_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lease_uploads
            WHERE lease_uploads.id = extracted_data.lease_upload_id
            AND lease_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own extracted data"
    ON extracted_data FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lease_uploads
            WHERE lease_uploads.id = extracted_data.lease_upload_id
            AND lease_uploads.user_id = auth.uid()
        )
    );

-- welcome_packs: users can access via their lease_uploads
CREATE POLICY "Users can view own welcome packs"
    ON welcome_packs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lease_uploads
            WHERE lease_uploads.id = welcome_packs.lease_upload_id
            AND lease_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own welcome packs"
    ON welcome_packs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lease_uploads
            WHERE lease_uploads.id = welcome_packs.lease_upload_id
            AND lease_uploads.user_id = auth.uid()
        )
    );

-- ============================================================
-- Storage Buckets
-- ============================================================

-- Create storage buckets (run via Supabase SQL editor or dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('leases', 'leases', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('welcome-packs', 'welcome-packs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can only access their own files
-- Leases bucket
CREATE POLICY "Users can upload to own leases folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'leases'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own leases"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'leases'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Welcome packs bucket
CREATE POLICY "Users can upload to own welcome-packs folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'welcome-packs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own welcome-packs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'welcome-packs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
