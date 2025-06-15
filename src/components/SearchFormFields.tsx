
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building } from "lucide-react";

interface SearchFormFieldsProps {
  location: string;
  setLocation: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  radius: string;
  setRadius: (value: string) => void;
}

const SearchFormFields = ({
  location,
  setLocation,
  industry,
  setIndustry,
  radius,
  setRadius
}: SearchFormFieldsProps) => {
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

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default SearchFormFields;
