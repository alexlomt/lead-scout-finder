import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { openStreetMapService } from "@/services/openStreetMapService";
import { WebsiteAnalysisService } from "@/services/websiteAnalysisService";
import { Search, MapPin, Target, Building2 } from "lucide-react";

interface SearchParams {
  location: string;
  radius: string;
  industry: string | null;
}

const industryOptions = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'store', label: 'Store' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'hairdresser', label: 'Hairdresser' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'bank', label: 'Bank' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: ' Carpenter', label: ' Carpenter' },
  { value: ' Painter', label: ' Painter' },
  { value: ' Gym', label: ' Gym' },
  { value: ' Spa', label: ' Spa' },
  { value: ' Bakery', label: ' Bakery' },
  { value: ' Butcher', label: ' Butcher' },
  { value: ' Florist', label: ' Florist' },
  { value: ' Bookstore', label: ' Bookstore' },
  { value: ' Clothing Store', label: ' Clothing Store' },
  { value: ' Furniture Store', label: ' Furniture Store' },
  { value: ' Electronics Store', label: ' Electronics Store' },
  { value: ' Travel Agency', label: ' Travel Agency' },
  { value: ' Real Estate Agency', label: ' Real Estate Agency' },
  { value: ' Insurance Company', label: ' Insurance Company' },
  { value: ' School', label: ' School' },
  { value: ' Library', label: ' Library' },
  { value: ' Museum', label: ' Museum' },
  { value: ' Art Gallery', label: ' Art Gallery' },
  { value: ' Movie Theater', label: ' Movie Theater' },
  { value: ' Park', label: ' Park' },
  { value: ' Gas Station', label: ' Gas Station' },
  { value: ' Car Repair', label: ' Car Repair' },
  { value: ' Other', label: ' Other' },
];

const SearchForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("10");
  const [industry, setIndustry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to perform searches");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting search with criteria:', { location, radius, industry });
      
      const searchParams = {
        location,
        industry: industry || null,
        radius: parseInt(radius)
      };

      console.log('Searching businesses with params:', searchParams);
      const businesses = await openStreetMapService.searchBusinesses(searchParams);
      
      if (businesses.length === 0) {
        toast.error("No businesses found for the given criteria");
        setIsLoading(false);
        return;
      }

      console.log(`Found ${businesses.length} businesses from OpenStreetMap`);
      
      // Save search to database
      const { data: searchData, error: searchError } = await supabase
        .from('searches')
        .insert({
          user_id: user.id,
          location,
          industry: industry || null,
          radius: parseInt(radius),
          results_count: businesses.length
        })
        .select()
        .single();

      if (searchError || !searchData) {
        console.error('Search save error:', searchError);
        toast.error("Failed to save search");
        setIsLoading(false);
        return;
      }

      // Save search results
      const searchResults = businesses.map(business => ({
        search_id: searchData.id,
        business_name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        has_website: !!business.website,
        has_social_media: false, // Will be determined by enhanced analysis
        web_presence_score: business.website ? 8 : 3,
        website_quality_score: business.website ? 20 : 0,
        digital_presence_score: business.website ? 15 : (business.phone || business.email ? 10 : 5),
        seo_score: business.website ? 10 : 0,
        overall_score: business.website ? 45 : 15,
        analysis_status: 'basic_complete'
      }));

      const { error: resultsError } = await supabase
        .from('search_results')
        .insert(searchResults);

      if (resultsError) {
        console.error('Results save error:', resultsError);
        toast.error("Failed to save search results");
        setIsLoading(false);
        return;
      }

      console.log(`Saved ${businesses.length} search results`);
      
      // Start enhanced analysis in the background
      toast.success(`Found ${businesses.length} businesses. Starting enhanced analysis...`);
      
      // Trigger enhanced analysis without waiting for it
      WebsiteAnalysisService.analyzeSearchResults(searchData.id).catch(error => {
        console.error('Enhanced analysis failed to start:', error);
      });

      // Navigate to results page
      navigate(`/results?search=${searchData.id}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-500" />
          <span>Business Search</span>
        </CardTitle>
        <CardDescription>
          Find local businesses and analyze their online presence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>Location</span>
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="radius" className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span>Radius (miles)</span>
            </Label>
            <Input
              id="radius"
              type="number"
              placeholder="Enter radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="industry" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span>Industry (optional)</span>
            </Label>
            <Select onValueChange={setIndustry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              "Start Search"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
