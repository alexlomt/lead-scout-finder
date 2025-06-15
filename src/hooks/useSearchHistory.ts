
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SavedSearch {
  id: string;
  name: string;
  location: string;
  industry: string;
  radius: number;
  resultsCount: number;
  createdAt: string;
  lastRun: string;
}

export const useSearchHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSavedSearches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Try to fetch from saved_searches table first, fall back to searches table
      let { data, error } = await supabase
        .from('saved_searches' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // If saved_searches doesn't exist yet, use searches table as fallback
      if (error && error.code === '42P01') {
        const { data: searchData, error: searchError } = await supabase
          .from('searches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (searchError) {
          console.error('Error loading searches:', searchError);
          toast({
            title: "Error",
            description: "Failed to load saved searches.",
            variant: "destructive",
          });
          return;
        }

        const formattedSearches: SavedSearch[] = searchData.map(search => ({
          id: search.id,
          name: `${search.location} - ${search.industry || 'All Industries'}`,
          location: search.location,
          industry: search.industry || 'All Industries',
          radius: search.radius,
          resultsCount: search.results_count || 0,
          createdAt: search.created_at,
          lastRun: search.created_at,
        }));

        setSavedSearches(formattedSearches);
        return;
      }

      if (error) {
        console.error('Error loading saved searches:', error);
        toast({
          title: "Error",
          description: "Failed to load saved searches.",
          variant: "destructive",
        });
        return;
      }

      const formattedSearches: SavedSearch[] = data.map((search: any) => ({
        id: search.id,
        name: search.search_name,
        location: search.location,
        industry: search.industry || 'All Industries',
        radius: search.radius,
        resultsCount: search.results_count || 0,
        createdAt: search.created_at,
        lastRun: search.last_run || search.created_at,
      }));

      setSavedSearches(formattedSearches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast({
        title: "Error",
        description: "Failed to load saved searches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async (searchParams: {
    name: string;
    location: string;
    industry: string;
    radius: number;
    resultsCount: number;
  }) => {
    if (!user) return false;

    try {
      // Try to save to saved_searches table
      const { error } = await supabase
        .from('saved_searches' as any)
        .insert({
          user_id: user.id,
          search_name: searchParams.name,
          location: searchParams.location,
          industry: searchParams.industry,
          radius: searchParams.radius,
          results_count: searchParams.resultsCount,
          last_run: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving search:', error);
        toast({
          title: "Error",
          description: "Failed to save search.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Search Saved",
        description: "Your search has been saved for future use.",
      });

      await loadSavedSearches();
      return true;
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "Failed to save search.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSearch = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_searches' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting search:', error);
        return false;
      }

      setSavedSearches(prev => prev.filter(search => search.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting search:', error);
      return false;
    }
  };

  const updateLastRun = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_searches' as any)
        .update({
          last_run: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating last run:', error);
        return;
      }

      await loadSavedSearches();
    } catch (error) {
      console.error('Error updating last run:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedSearches();
    }
  }, [user]);

  return {
    savedSearches,
    loading,
    saveSearch,
    deleteSearch,
    updateLastRun,
    refresh: loadSavedSearches,
  };
};
