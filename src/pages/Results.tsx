
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Search, Globe, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  has_social_media: boolean;
  web_presence_score: number;
}

interface SearchData {
  id: string;
  location: string;
  industry: string | null;
  radius: number;
  results_count: number;
  created_at: string;
}

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchId = searchParams.get('search');
  
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!searchId || !user) {
      navigate('/dashboard');
      return;
    }

    fetchSearchData();
  }, [searchId, user]);

  const fetchSearchData = async () => {
    try {
      // Fetch search data
      const { data: search, error: searchError } = await supabase
        .from('searches')
        .select('*')
        .eq('id', searchId)
        .eq('user_id', user!.id)
        .single();

      if (searchError || !search) {
        toast.error("Search not found");
        navigate('/dashboard');
        return;
      }

      setSearchData(search);

      // Fetch search results
      const { data: searchResults, error: resultsError } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId);

      if (resultsError) {
        console.error('Results fetch error:', resultsError);
        toast.error("Failed to load results");
        return;
      }

      setResults(searchResults || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getPresenceScore = (score: number) => {
    if (score <= 3) return { label: "Poor", color: "destructive" };
    if (score <= 6) return { label: "Fair", color: "secondary" };
    return { label: "Good", color: "default" };
  };

  const toggleSelection = (resultId: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(resultId)) {
      newSelection.delete(resultId);
    } else {
      newSelection.add(resultId);
    }
    setSelectedResults(newSelection);
  };

  const selectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map(r => r.id)));
    }
  };

  const exportSelected = () => {
    const selectedData = results.filter(r => selectedResults.has(r.id));
    
    if (selectedData.length === 0) {
      toast.error("Please select at least one result to export");
      return;
    }

    // Create CSV content
    const headers = ["Business Name", "Address", "Phone", "Email", "Website", "Web Presence Score"];
    const csvContent = [
      headers.join(","),
      ...selectedData.map(result => [
        `"${result.business_name}"`,
        `"${result.address || ''}"`,
        `"${result.phone || ''}"`,
        `"${result.email || ''}"`,
        `"${result.website || ''}"`,
        result.web_presence_score
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `htmlscout-results-${searchData?.location}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedData.length} results`);
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
        {/* Search Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {searchData?.location}
            </span>
            <span>Radius: {searchData?.radius} miles</span>
            {searchData?.industry && <span>Industry: {searchData.industry}</span>}
            <span>{results.length} results found</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={selectAll}
              disabled={results.length === 0}
            >
              {selectedResults.size === results.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-gray-600">
              {selectedResults.size} of {results.length} selected
            </span>
          </div>
          <Button 
            onClick={exportSelected}
            disabled={selectedResults.size === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Selected
          </Button>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Results</CardTitle>
            <CardDescription>
              Businesses with poor web presence that could benefit from your services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found for this search.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Web Presence</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const presenceInfo = getPresenceScore(result.web_presence_score);
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedResults.has(result.id)}
                            onChange={() => toggleSelection(result.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{result.business_name}</div>
                            {result.address && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {result.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {result.phone && (
                              <div className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {result.phone}
                              </div>
                            )}
                            {result.email && (
                              <div className="text-sm flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {result.email}
                              </div>
                            )}
                            {result.website && (
                              <div className="text-sm flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <a 
                                  href={result.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {result.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs">
                              Website: {result.has_website ? 'Yes' : 'No'}
                            </div>
                            <div className="text-xs">
                              Social Media: {result.has_social_media ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={presenceInfo.color as any}>
                            {presenceInfo.label} ({result.web_presence_score}/10)
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Results;
