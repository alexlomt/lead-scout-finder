
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SearchFormFields from "./SearchFormFields";
import { openStreetMapService, BusinessData } from "@/services/openStreetMapService";
import { WebsiteAnalysisService } from "@/services/websiteAnalysisService";
import { supabase } from "@/integrations/supabase/client";

export interface SearchCriteria {
  location: string;
  radius: string;
  industry: string;
}

const SearchForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: "",
    radius: "10",
    industry: "",
  });

  const calculateWebPresenceScore = (business: BusinessData): number => {
    let score = 0;
    
    // Basic presence (name and location)
    if (business.name) score += 2;
    if (business.address) score += 1;
    
    // Contact information
    if (business.phone) score += 2;
    if (business.email) score += 2;
    
    // Website presence
    if (business.website) {
      score += 3;
    } else {
      // If no website, this is a good lead for web services
      score = Math.max(score - 2, 1);
    }
    
    return Math.min(score, 10);
  };

  const saveSearchResults = async (searchId: string, businesses: BusinessData[]) => {
    try {
      const searchResults = businesses.map(business => ({
        search_id: searchId,
        business_name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        has_website: !!business.website,
        has_social_media: false, // We'll enhance this later with social media APIs
        web_presence_score: calculateWebPresenceScore(business),
        // Initialize enhanced scoring fields
        website_quality_score: 0,
        digital_presence_score: 0,
        seo_score: 0,
        overall_score: 0,
        analysis_status: 'pending'
      }));

      const { error } = await supabase
        .from('search_results')
        .insert(searchResults);

      if (error) {
        console.error('Error saving search results:', error);
        throw error;
      }

      console.log(`Saved ${searchResults.length} search results`);
    } catch (error) {
      console.error('Failed to save search results:', error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to run searches.",
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
      console.log('Starting search with criteria:', searchCriteria);

      // Search for businesses using OpenStreetMap
      const businesses = await openStreetMapService.searchBusinesses({
        location: searchCriteria.location,
        industry: searchCriteria.industry,
        radius: parseInt(searchCriteria.radius)
      });

      console.log(`Found ${businesses.length} businesses from OpenStreetMap`);

      if (businesses.length === 0) {
        toast({
          title: "No Results Found",
          description: "No businesses found in this area. Try expanding your search radius or changing the location.",
          variant: "destructive",
        });
        return;
      }

      // Create search record in database
      const { data: searchRecord, error: searchError } = await supabase
        .from('searches')
        .insert({
          user_id: user.id,
          location: searchCriteria.location,
          industry: searchCriteria.industry === 'all' ? null : searchCriteria.industry,
          radius: parseInt(searchCriteria.radius),
          results_count: businesses.length
        })
        .select()
        .single();

      if (searchError) {
        console.error('Error creating search record:', searchError);
        throw searchError;
      }

      // Save search results to database
      await saveSearchResults(searchRecord.id, businesses);

      // Update search count after successful search
      await refreshProfile();

      // Start enhanced analysis in the background
      WebsiteAnalysisService.analyzeSearchResults(searchRecord.id).catch(error => {
        console.error('Background analysis failed:', error);
      });

      // Navigate to results with search ID
      navigate(`/results?search=${searchRecord.id}`);

      toast({
        title: "Search Completed",
        description: `Found ${businesses.length} businesses! Enhanced analysis starting in background.`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "There was an error running your search. Please try again.",
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
