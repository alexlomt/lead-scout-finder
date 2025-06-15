
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

interface SavedSearchHistoryProps {
  savedSearches: SavedSearch[];
  onRerunSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
}

const SavedSearchHistory = ({ savedSearches, onRerunSearch, onDeleteSearch }: SavedSearchHistoryProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRerun = (search: SavedSearch) => {
    const canSearch = (profile?.searches_used || 0) < (profile?.searches_limit || 5);
    
    if (!canSearch) {
      toast({
        title: "Search Limit Reached",
        description: "You've reached your monthly search limit. Please upgrade your plan to continue searching.",
        variant: "destructive",
      });
      return;
    }

    onRerunSearch(search);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      onDeleteSearch(id);
      toast({
        title: "Search Deleted",
        description: "The saved search has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (savedSearches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No saved searches yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Run a search and save it to access it later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        <Badge variant="secondary">
          {savedSearches.length} saved
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedSearches.map((search) => (
          <Card key={search.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{search.name}</span>
                <Badge variant="outline" className="ml-2">
                  {search.resultsCount} results
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{search.location} ({search.radius} miles)</span>
                </div>
                <div>Industry: {search.industry}</div>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(search.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Last run: {formatDate(search.lastRun)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleRerun(search)}
                  size="sm"
                  className="flex-1 flex items-center gap-2"
                  disabled={(profile?.searches_used || 0) >= (profile?.searches_limit || 5)}
                >
                  <Play className="h-4 w-4" />
                  Rerun
                </Button>
                <Button
                  onClick={() => handleDelete(search.id)}
                  size="sm"
                  variant="outline"
                  disabled={deletingId === search.id}
                  className="px-3"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedSearchHistory;
