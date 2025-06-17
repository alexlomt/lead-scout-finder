
-- Add new columns to search_results table for enhanced scoring
ALTER TABLE public.search_results 
ADD COLUMN website_quality_score INTEGER DEFAULT 0,
ADD COLUMN digital_presence_score INTEGER DEFAULT 0,
ADD COLUMN seo_score INTEGER DEFAULT 0,
ADD COLUMN overall_score INTEGER DEFAULT 0,
ADD COLUMN analysis_status TEXT DEFAULT 'pending',
ADD COLUMN last_analyzed TIMESTAMP WITH TIME ZONE;

-- Update existing records to have basic scores based on current web_presence_score
UPDATE public.search_results 
SET 
  website_quality_score = CASE 
    WHEN has_website = true THEN web_presence_score * 4
    ELSE 0
  END,
  digital_presence_score = CASE 
    WHEN has_website = true THEN web_presence_score * 2
    WHEN phone IS NOT NULL OR email IS NOT NULL THEN 10
    ELSE 5
  END,
  seo_score = CASE 
    WHEN has_website = true THEN web_presence_score * 2
    ELSE 0
  END,
  overall_score = LEAST(web_presence_score * 10, 100),
  analysis_status = 'basic_complete';

-- Add constraints to ensure scores are within valid ranges
ALTER TABLE public.search_results 
ADD CONSTRAINT check_website_quality_score CHECK (website_quality_score >= 0 AND website_quality_score <= 40),
ADD CONSTRAINT check_digital_presence_score CHECK (digital_presence_score >= 0 AND digital_presence_score <= 30),
ADD CONSTRAINT check_seo_score CHECK (seo_score >= 0 AND seo_score <= 30),
ADD CONSTRAINT check_overall_score CHECK (overall_score >= 0 AND overall_score <= 100);

-- Create index for efficient querying by analysis status
CREATE INDEX idx_search_results_analysis_status ON public.search_results(analysis_status);
CREATE INDEX idx_search_results_overall_score ON public.search_results(overall_score DESC);
