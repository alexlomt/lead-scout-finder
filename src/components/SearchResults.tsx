
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink, Mail, Phone, Globe, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BusinessLead {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  industry: string;
  webPresenceScore: number;
  socialMediaPresence: {
    facebook: boolean;
    twitter: boolean;
    linkedin: boolean;
    instagram: boolean;
  };
}

interface SearchResultsProps {
  results: BusinessLead[];
  searchQuery: {
    location: string;
    industry: string;
    radius: number;
  };
  onSaveSearch: () => void;
}

const SearchResults = ({ results, searchQuery, onSaveSearch }: SearchResultsProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'webPresence' | 'location'>('webPresence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getWebPresenceBadge = (score: number) => {
    if (score <= 3) return { variant: 'destructive' as const, label: 'Poor', color: 'bg-red-100 text-red-800' };
    if (score <= 6) return { variant: 'secondary' as const, label: 'Basic', color: 'bg-yellow-100 text-yellow-800' };
    return { variant: 'default' as const, label: 'Good', color: 'bg-green-100 text-green-800' };
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(new Set(results.map(r => r.id)));
    } else {
      setSelectedResults(new Set());
    }
  };

  const handleSelectResult = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedResults);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedResults(newSelected);
  };

  const sortedResults = [...results].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'webPresence':
        aValue = a.webPresenceScore;
        bValue = b.webPresenceScore;
        break;
      case 'location':
        aValue = `${a.city}, ${a.state}`.toLowerCase();
        bValue = `${b.city}, ${b.state}`.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExportCSV = () => {
    const selectedData = results.filter(r => selectedResults.has(r.id));
    
    if (selectedData.length === 0) {
      toast({
        title: "No Results Selected",
        description: "Please select at least one result to export.",
        variant: "destructive",
      });
      return;
    }

    const exportLimit = profile?.exports_limit || 10;
    if (selectedData.length > exportLimit) {
      toast({
        title: "Export Limit Exceeded",
        description: `You can export up to ${exportLimit} rows. Please upgrade your plan for higher limits.`,
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      'Business Name',
      'Address',
      'City',
      'State',
      'ZIP Code',
      'Phone',
      'Email',
      'Website',
      'Industry',
      'Web Presence Score',
      'Facebook',
      'Twitter',
      'LinkedIn',
      'Instagram'
    ];

    const csvContent = [
      headers.join(','),
      ...selectedData.map(business => [
        `"${business.name}"`,
        `"${business.address}"`,
        `"${business.city}"`,
        `"${business.state}"`,
        `"${business.zipCode}"`,
        `"${business.phone || ''}"`,
        `"${business.email || ''}"`,
        `"${business.website || ''}"`,
        `"${business.industry}"`,
        business.webPresenceScore,
        business.socialMediaPresence.facebook ? 'Yes' : 'No',
        business.socialMediaPresence.twitter ? 'Yes' : 'No',
        business.socialMediaPresence.linkedin ? 'Yes' : 'No',
        business.socialMediaPresence.instagram ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `htmlscout-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${selectedData.length} leads exported to CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <Button onClick={onSaveSearch} variant="outline" size="sm">
              Save Search
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{searchQuery.location} ({searchQuery.radius} miles)</span>
            </div>
            <div>Industry: {searchQuery.industry}</div>
            <div className="font-medium text-primary">{results.length} businesses found</div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedResults.size === results.length && results.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({selectedResults.size} selected)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="webPresence">Web Presence</option>
            <option value="name">Business Name</option>
            <option value="location">Location</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={selectedResults.size === 0}
            className="flex items-center gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Export CSV ({selectedResults.size})
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedResults.map((business) => {
          const webPresence = getWebPresenceBadge(business.webPresenceScore);
          return (
            <Card key={business.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedResults.has(business.id)}
                      onCheckedChange={(checked) => handleSelectResult(business.id, !!checked)}
                    />
                    <div>
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={webPresence.color}>
                          {webPresence.label} Web Presence
                        </Badge>
                        <span className="text-sm text-gray-500">Score: {business.webPresenceScore}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{business.address}, {business.city}, {business.state} {business.zipCode}</span>
                </div>

                <div className="text-sm text-gray-600">
                  Industry: {business.industry}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs font-medium text-gray-500">Social Media:</span>
                  <div className="flex gap-1">
                    {business.socialMediaPresence.facebook && (
                      <Badge variant="outline" className="text-xs">FB</Badge>
                    )}
                    {business.socialMediaPresence.twitter && (
                      <Badge variant="outline" className="text-xs">TW</Badge>
                    )}
                    {business.socialMediaPresence.linkedin && (
                      <Badge variant="outline" className="text-xs">LI</Badge>
                    )}
                    {business.socialMediaPresence.instagram && (
                      <Badge variant="outline" className="text-xs">IG</Badge>
                    )}
                    {!Object.values(business.socialMediaPresence).some(Boolean) && (
                      <Badge variant="secondary" className="text-xs">None</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No businesses found for your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchResults;
