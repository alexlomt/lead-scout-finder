
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Building, Calendar, BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SavedSearch {
  id: string;
  location: string;
  industry: string | null;
  radius: number;
  results_count: number | null;
  created_at: string;
}

const SavedSearches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerunningSearch, setRerunningSearch] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/dashboard');
      return;
    }

    fetchSavedSearches();
  }, [user]);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('searches')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch searches error:', error);
        toast.error("Failed to load saved searches");
        return;
      }

      setSearches(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const rerunSearch = async (search: SavedSearch) => {
    setRerunningSearch(search.id);
    
    try {
      // Navigate to search page with prefilled data
      const searchParams = new URLSearchParams({
        location: search.location,
        industry: search.industry || 'all',
        radius: search.radius.toString()
      });
      
      navigate(`/search?${searchParams.toString()}`);
    } catch (error) {
      console.error('Rerun search error:', error);
      toast.error("Failed to rerun search");
    } finally {
      setRerunningSearch(null);
    }
  };

  const viewResults = (searchId: string) => {
    navigate(`/results?search=${searchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Search className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-primary">HTMLScout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Searches</h1>
          <p className="text-gray-600">
            View and rerun your previous searches to find new leads
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {searches.length} saved searches
            </span>
          </div>
          <Button 
            onClick={() => navigate('/search')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </div>

        {/* Searches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Search History</CardTitle>
            <CardDescription>
              All your previous searches with the ability to rerun them or view results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searches.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No saved searches yet</p>
                <p className="text-gray-400 mb-4">Run your first search to see it here</p>
                <Button onClick={() => navigate('/search')}>
                  Start Your First Search
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Search Details</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {search.location}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Building className="h-4 w-4 text-gray-400" />
                            {search.industry || 'All Industries'} • {search.radius} miles
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-gray-400" />
                          <Badge variant="secondary">
                            {search.results_count || 0} leads
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rerunSearch(search)}
                            disabled={rerunningSearch === search.id}
                            className="flex items-center gap-1"
                          >
                            {rerunningSearch === search.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Rerun
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewResults(search.id)}
                            disabled={!search.results_count}
                          >
                            View Results
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SavedSearches;
