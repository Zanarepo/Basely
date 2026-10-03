-- Add ADR linkage columns to wbs_elements and raid_log_entries

ALTER TABLE wbs_elements
  ADD COLUMN IF NOT EXISTS linked_adr_ids text[] DEFAULT '{}';

ALTER TABLE raid_log_entries
  ADD COLUMN IF NOT EXISTS source_adr_id uuid REFERENCES architecture_decision_records(id) ON DELETE SET NULL;
