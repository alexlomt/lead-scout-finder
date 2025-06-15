
-- Create saved_searches table for storing user's saved search queries
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  location TEXT NOT NULL,
  industry TEXT,
  radius INTEGER NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_run TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_radius CHECK (radius IN (5, 10, 25, 50))
);

-- Enable Row Level Security
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches" 
  ON public.saved_searches 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches" 
  ON public.saved_searches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" 
  ON public.saved_searches 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" 
  ON public.saved_searches 
  FOR DELETE 
  USING (auth.uid() = user_id);
