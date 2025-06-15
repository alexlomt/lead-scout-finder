
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SearchFormFields from "./SearchFormFields";
import RateLimitDisplay from "./RateLimitDisplay";
import { useRateLimit } from "@/hooks/useRateLimit";

export interface SearchCriteria {
  location: string;
  radius: string;
  industry: string;
}

const SearchForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkLimit } = useRateLimit();
  const [isSearching, setIsSearching] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: "",
    radius: "10",
    industry: "",
  });

  const handleSearch = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to run searches.",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit first
    if (!checkLimit('search')) {
      toast({
        title: "Rate Limit Exceeded",
        description: "You've reached the maximum number of searches per hour. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has searches remaining
    if (!profile?.searches_used || !profile?.searches_limit) {
      toast({
        title: "Error",
        description: "Unable to verify your search limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (profile.searches_used >= profile.searches_limit) {
      toast({
        title: "Search Limit Reached",
        description: `You've used all ${profile.searches_limit} searches. Upgrade your plan to continue.`,
        variant: "destructive",
      });
      return;
    }

    if (!searchCriteria.location || !searchCriteria.industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in both location and industry fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update search count after successful search
      await refreshProfile();

      // Navigate to results with search criteria
      navigate('/results', { 
        state: { 
          searchCriteria,
          searchId: Date.now().toString() 
        } 
      });

      toast({
        title: "Search Completed",
        description: "Found businesses matching your criteria!",
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "There was an error running your search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const searchesRemaining = profile ? profile.searches_limit - profile.searches_used : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>
            Define your target market to find businesses with poor web presence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SearchFormFields 
            location={searchCriteria.location}
            setLocation={(value) => setSearchCriteria(prev => ({ ...prev, location: value }))}
            industry={searchCriteria.industry}
            setIndustry={(value) => setSearchCriteria(prev => ({ ...prev, industry: value }))}
            radius={searchCriteria.radius}
            setRadius={(value) => setSearchCriteria(prev => ({ ...prev, radius: value }))}
          />
          
          {/* Rate limit display */}
          <RateLimitDisplay operation="search" />

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {profile && (
                <span>
                  {searchesRemaining} of {profile.searches_limit} searches remaining
                </span>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || searchesRemaining <= 0}
              className="min-w-32"
            >
              {isSearching ? "Searching..." : "Run Search"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchForm;
