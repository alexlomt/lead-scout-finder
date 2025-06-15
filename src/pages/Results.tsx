
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, ArrowLeft, ExternalLink, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import Header from '@/components/Header';

type SearchResult = Database['public']['Tables']['search_results']['Row'];

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const searchId = searchParams.get('searchId');

  useEffect(() => {
    if (!searchId) {
      navigate('/');
      return;
    }
    fetchResults();
  }, [searchId]);

  const fetchResults = async () => {
    if (!searchId) return;

    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load search results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(new Set(results.map(r => r.id)));
    } else {
      setSelectedResults(new Set());
    }
  };

  const handleSelectResult = (resultId: string, checked: boolean) => {
    const newSelected = new Set(selectedResults);
    if (checked) {
      newSelected.add(resultId);
    } else {
      newSelected.delete(resultId);
    }
    setSelectedResults(newSelected);
  };

  const exportToCSV = async () => {
    if (selectedResults.size === 0) {
      toast({
        title: "No results selected",
        description: "Please select at least one result to export.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    try {
      const selectedData = results.filter(r => selectedResults.has(r.id));
      
      // Create CSV content
      const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Email', 'Web Presence Score', 'Has Website', 'Has Social Media'];
      const csvContent = [
        headers.join(','),
        ...selectedData.map(result => [
          `"${result.business_name}"`,
          `"${result.address || ''}"`,
          `"${result.phone || ''}"`,
          `"${result.website || ''}"`,
          `"${result.email || ''}"`,
          result.web_presence_score || 0,
          result.has_website ? 'Yes' : 'No',
          result.has_social_media ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `htmlscout-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful!",
        description: `Exported ${selectedData.length} results to CSV.`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your results.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getWebPresenceBadge = (score: number | null, hasWebsite: boolean | null, hasSocial: boolean | null) => {
    if (score === null) return <Badge variant="secondary">Unknown</Badge>;
    
    if (score >= 80) return <Badge variant="default" className="bg-green-600">Strong</Badge>;
    if (score >= 50) return <Badge variant="default" className="bg-yellow-600">Moderate</Badge>;
    if (score >= 20) return <Badge variant="default" className="bg-orange-600">Weak</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
            <h1 className="text-2xl font-bold text-[#0A2342]">Search Results</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {results.length} results found • {selectedResults.size} selected
            </span>
            <Button 
              onClick={exportToCSV} 
              disabled={selectedResults.size === 0 || exporting}
              className="bg-[#3B82F6] hover:bg-[#2563EB]"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Business Listings</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedResults.size === results.length && results.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-normal">
                  Select All
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No results found for this search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Web Presence</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedResults.has(result.id)}
                            onCheckedChange={(checked) => 
                              handleSelectResult(result.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.business_name}</div>
                            {result.address && (
                              <div className="text-sm text-gray-500">{result.address}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {result.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {result.phone}
                              </div>
                            )}
                            {result.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {result.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getWebPresenceBadge(
                            result.web_presence_score,
                            result.has_website,
                            result.has_social_media
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Score: {result.web_presence_score || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.website ? (
                            <a
                              href={result.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#3B82F6] hover:underline text-sm flex items-center gap-1"
                            >
                              Visit Site
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No website</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
