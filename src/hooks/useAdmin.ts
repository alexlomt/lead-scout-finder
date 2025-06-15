
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_plan: SubscriptionPlan;
  searches_used: number;
  searches_limit: number;
  exports_limit: number;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('current_user_is_admin');
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading audit logs:', error);
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const resetUserRateLimit = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('reset_user_rate_limits', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error resetting rate limit:', error);
        toast({
          title: "Error",
          description: "Failed to reset rate limit.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Rate limit reset successfully.",
      });

      await loadUsers();
      await loadAuditLogs();
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      toast({
        title: "Error",
        description: "Failed to reset rate limit.",
        variant: "destructive",
      });
      return false;
    }
  };

  const changeUserPlan = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase.rpc('change_user_plan', {
        target_user_id: userId,
        new_plan: newPlan
      });

      if (error) {
        console.error('Error changing user plan:', error);
        toast({
          title: "Error",
          description: "Failed to change user plan.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "User plan changed successfully.",
      });

      await loadUsers();
      await loadAuditLogs();
      return true;
    } catch (error) {
      console.error('Error changing user plan:', error);
      toast({
        title: "Error",
        description: "Failed to change user plan.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadAuditLogs();
    }
  }, [isAdmin]);

  return {
    isAdmin,
    loading,
    users,
    auditLogs,
    resetUserRateLimit,
    changeUserPlan,
    refreshData: () => {
      loadUsers();
      loadAuditLogs();
    }
  };
};
