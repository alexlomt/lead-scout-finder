
-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'base', 'pro', 'agency');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  searches_used INTEGER NOT NULL DEFAULT 0,
  searches_limit INTEGER NOT NULL DEFAULT 5,
  exports_limit INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create searches table to track user searches and enable saved searches
CREATE TABLE public.searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  industry TEXT,
  radius INTEGER NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_radius CHECK (radius IN (5, 10, 25, 50))
);

-- Create search_results table to store business listings from searches
CREATE TABLE public.search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  web_presence_score INTEGER CHECK (web_presence_score >= 0 AND web_presence_score <= 100),
  has_website BOOLEAN DEFAULT false,
  has_social_media BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for searches
CREATE POLICY "Users can view their own searches" 
  ON public.searches 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches" 
  ON public.searches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" 
  ON public.searches 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" 
  ON public.searches 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for search_results
CREATE POLICY "Users can view results from their own searches" 
  ON public.search_results 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.searches 
    WHERE searches.id = search_results.search_id 
    AND searches.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert results for their own searches" 
  ON public.search_results 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.searches 
    WHERE searches.id = search_results.search_id 
    AND searches.user_id = auth.uid()
  ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update search limits based on subscription plan
CREATE OR REPLACE FUNCTION public.update_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  CASE NEW.subscription_plan
    WHEN 'free' THEN
      NEW.searches_limit := 5;
      NEW.exports_limit := 10;
    WHEN 'base' THEN
      NEW.searches_limit := 50;
      NEW.exports_limit := 500;
    WHEN 'pro' THEN
      NEW.searches_limit := 200;
      NEW.exports_limit := 2000;
    WHEN 'agency' THEN
      NEW.searches_limit := 500;
      NEW.exports_limit := 999999; -- Unlimited
  END CASE;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger to update limits when subscription plan changes
CREATE TRIGGER update_limits_on_plan_change
  BEFORE UPDATE OF subscription_plan ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_plan_limits();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_plan_limits();
