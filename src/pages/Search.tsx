import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, MapPin, Building, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Search = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize state from URL params if available
  const [location, setLocation] = useState(searchParams.get('location') || "");
  const [industry, setIndustry] = useState(searchParams.get('industry') || "");
  const [radius, setRadius] = useState(searchParams.get('radius') || "10");
  const [isSearching, setIsSearching] = useState(false);

  const industries = [
    "Restaurants & Food",
    "Retail & Shopping",
    "Health & Medical",
    "Professional Services",
    "Home Services",
    "Beauty & Wellness",
    "Automotive",
    "Real Estate",
    "Construction",
    "Education",
    "Entertainment",
    "Non-Profit"
  ];

  const handleSearch = async () => {
    if (!user || !profile) {
      toast.error("Please log in to continue");
      return;
    }

    if (profile.searches_used >= profile.searches_limit) {
      toast.error("You've reached your search limit. Please upgrade your plan.");
      return;
    }

    setIsSearching(true);
    
    try {
      // Create a new search record
      const { data: searchData, error: searchError } = await supabase
        .from('searches')
        .insert({
          user_id: user.id,
          location,
          industry: industry === "all" ? null : industry,
          radius: parseInt(radius)
        })
        .select()
        .single();

      if (searchError) {
        console.error('Search creation error:', searchError);
        toast.error("Failed to create search");
        return;
      }

      // Update user's search count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          searches_used: profile.searches_used + 1 
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
      }

      // Refresh profile to get updated search count
      await refreshProfile();

      // Simulate search results (in real app, this would call external APIs)
      const mockResults = [
        {
          business_name: "Local Restaurant",
          address: "123 Main St, " + location,
          phone: "(555) 123-4567",
          email: "contact@localrestaurant.com",
          website: null,
          has_website: false,
          has_social_media: false,
          web_presence_score: 2
        },
        {
          business_name: "Auto Repair Shop",
          address: "456 Oak Ave, " + location,
          phone: "(555) 987-6543",
          email: null,
          website: "www.oldsite.com",
          has_website: true,
          has_social_media: false,
          web_presence_score: 4
        }
      ];

      // Insert mock results
      const { error: resultsError } = await supabase
        .from('search_results')
        .insert(
          mockResults.map(result => ({
            search_id: searchData.id,
            ...result
          }))
        );

      if (resultsError) {
        console.error('Results insertion error:', resultsError);
      }

      // Update search with results count
      await supabase
        .from('searches')
        .update({ results_count: mockResults.length })
        .eq('id', searchData.id);

      toast.success(`Found ${mockResults.length} potential leads!`);
      navigate(`/results?search=${searchData.id}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error("An error occurred during search");
    } finally {
      setIsSearching(false);
    }
  };

  const remainingSearches = profile ? profile.searches_limit - profile.searches_used : 0;

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
                <SearchIcon className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-primary">HTMLScout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Start Your Lead Search
          </h1>
          <p className="text-xl text-gray-600">
            Find businesses in your area that need better web presence
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <SearchIcon className="h-6 w-6 mr-2" />
              Search Parameters
            </CardTitle>
            <CardDescription>
              Configure your search to find the perfect prospects in your target market
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Input */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="location"
                  placeholder="Enter city or ZIP code (e.g., San Francisco, CA or 94102)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Industry Selection */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                Industry Category
              </Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select industry category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Radius Selection */}
            <div className="space-y-2">
              <Label htmlFor="radius" className="text-sm font-medium text-gray-700">
                Search Radius
              </Label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={!location || isSearching || remainingSearches <= 0}
              className="w-full h-12 bg-accent hover:bg-accent-600 text-white text-lg font-medium"
            >
              {isSearching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Scanning businesses...
                </div>
              ) : (
                <div className="flex items-center">
                  <SearchIcon className="h-5 w-5 mr-2" />
                  Run Scan
                </div>
              )}
            </Button>

            {/* Usage Info */}
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Searches remaining:</strong> {remainingSearches} of {profile?.searches_limit || 5}
                {remainingSearches <= 0 && (
                  <span className="block mt-1 text-red-600 font-medium">
                    You've reached your search limit. Upgrade your plan to continue.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Search;
