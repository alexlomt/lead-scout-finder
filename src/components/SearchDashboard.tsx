
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Building } from "lucide-react";

const SearchDashboard = () => {
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [radius, setRadius] = useState("10");
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
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      console.log("Search completed for:", { location, industry, radius });
    }, 2000);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Start Your Lead Search
          </h2>
          <p className="text-xl text-gray-600">
            Find businesses in your area that need better web presence
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <Search className="h-6 w-6 mr-2" />
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
              disabled={!location || isSearching}
              className="w-full h-12 bg-accent hover:bg-accent-600 text-white text-lg font-medium"
            >
              {isSearching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Scanning businesses...
                </div>
              ) : (
                <div className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Run Scan
                </div>
              )}
            </Button>

            {/* Usage Info */}
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Free Trial:</strong> You have 5 searches remaining. 
                <a href="#pricing" className="text-accent hover:underline ml-1">Upgrade to unlock more searches</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SearchDashboard;
