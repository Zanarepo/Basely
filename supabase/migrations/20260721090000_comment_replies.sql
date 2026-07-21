-- Migration: Support for nested comment replies
-- Version: 20260721090000_comment_replies

-- Add parent_id column
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for performance on parent_id
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
