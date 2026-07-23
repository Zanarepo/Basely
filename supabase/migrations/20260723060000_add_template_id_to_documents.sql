ALTER TABLE public.generated_documents 
ADD COLUMN IF NOT EXISTS custom_template_id UUID REFERENCES public.custom_document_templates(id) ON DELETE SET NULL;
