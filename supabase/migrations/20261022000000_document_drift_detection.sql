-- Add drift detection columns to generated_documents table
ALTER TABLE generated_documents
ADD COLUMN is_stale BOOLEAN DEFAULT false,
ADD COLUMN stale_reason TEXT;
