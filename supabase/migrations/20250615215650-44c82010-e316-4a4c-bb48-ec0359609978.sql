
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create admin_audit_logs table for tracking admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_audit_logs  
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
$$;

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin());

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.current_user_is_admin());

-- RLS policies for admin_audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

-- Function to reset user rate limits
CREATE OR REPLACE FUNCTION public.reset_user_rate_limits(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Reset searches_used to 0
  UPDATE public.profiles
  SET searches_used = 0,
      updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (admin_user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'reset_rate_limits',
    target_user_id,
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- Function to change user subscription plan
CREATE OR REPLACE FUNCTION public.change_user_plan(target_user_id UUID, new_plan subscription_plan)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_plan subscription_plan;
BEGIN
  -- Check if current user is admin
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get current plan
  SELECT subscription_plan INTO old_plan
  FROM public.profiles
  WHERE id = target_user_id;
  
  -- Update subscription plan (this will trigger the plan limits update)
  UPDATE public.profiles
  SET subscription_plan = new_plan,
      updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (admin_user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'change_subscription_plan',
    target_user_id,
    jsonb_build_object(
      'old_plan', old_plan,
      'new_plan', new_plan,
      'timestamp', now()
    )
  );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_plan TO authenticated;
