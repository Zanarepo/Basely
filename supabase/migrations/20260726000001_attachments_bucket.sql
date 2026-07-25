-- Sprint 26: Create Storage Bucket for Local Attachments

INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-attachments', 'project-attachments', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects
-- Allow authenticated users to upload files to their project folders
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
CREATE POLICY "Users can upload attachments" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'project-attachments'
);

-- Allow authenticated users to view attachments
DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;
CREATE POLICY "Users can view attachments" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'project-attachments'
);

-- Allow authenticated users to delete their own attachments
DROP POLICY IF EXISTS "Users can delete attachments" ON storage.objects;
CREATE POLICY "Users can delete attachments" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'project-attachments' AND owner = auth.uid()
);
