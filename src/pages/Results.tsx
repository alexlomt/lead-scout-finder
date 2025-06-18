
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnhancedSearchResults from "@/components/EnhancedSearchResults";

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
  website_quality_score: number | null;
  digital_presence_score: number | null;
  seo_score: number | null;
  overall_score: number | null;
  analysis_status: string | null;
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

      // Fetch ALL search results with enhanced scoring - removed pagination limit
      const { data: searchResults, error: resultsError } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId)
        .order('overall_score', { ascending: false, nullsFirst: false });

      if (resultsError) {
        console.error('Results fetch error:', resultsError);
        toast.error("Failed to load results");
        return;
      }

      console.log(`Loaded ${searchResults?.length || 0} total results for search ${searchId}`);
      setResults(searchResults || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResultSelect = (resultId: string, selected: boolean) => {
    const newSelection = new Set(selectedResults);
    if (selected) {
      newSelection.add(resultId);
    } else {
      newSelection.delete(resultId);
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

    // Create CSV content with enhanced scoring
    const headers = [
      "Business Name", "Address", "Phone", "Email", "Website",
      "Overall Score", "Website Quality", "Digital Presence", "SEO Score",
      "Analysis Status"
    ];
    const csvContent = [
      headers.join(","),
      ...selectedData.map(result => [
        `"${result.business_name}"`,
        `"${result.address || ''}"`,
        `"${result.phone || ''}"`,
        `"${result.email || ''}"`,
        `"${result.website || ''}"`,
        result.overall_score || 0,
        result.website_quality_score || 0,
        result.digital_presence_score || 0,
        result.seo_score || 0,
        `"${result.analysis_status || 'pending'}"`
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `htmlscout-enhanced-results-${searchData?.location}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedData.length} results with enhanced scoring`);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Search Results</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{searchData?.location}</span>
            <span>Radius: {searchData?.radius} miles</span>
            {searchData?.industry && <span>Industry: {searchData.industry}</span>}
            <span>{results.length} results found (all results loaded)</span>
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

        {/* Enhanced Results with Pagination */}
        <EnhancedSearchResults
          results={results}
          onResultSelect={handleResultSelect}
          selectedResults={selectedResults}
          searchId={searchId || undefined}
        />
      </main>
    </div>
  );
};

export default Results;
