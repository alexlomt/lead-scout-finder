
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Globe, Mail, Phone, MapPin, TrendingUp, Search, Zap } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { OnDemandAnalysisService, PageAnalysisProgress } from "@/services/onDemandAnalysisService";

interface EnhancedSearchResult {
  id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  website_quality_score: number | null;
  digital_presence_score: number | null;
  seo_score: number | null;
  overall_score: number | null;
  analysis_status: string | null;
  has_website: boolean;
  has_social_media: boolean;
}

interface EnhancedSearchResultsProps {
  results: EnhancedSearchResult[];
  onResultSelect: (id: string, selected: boolean) => void;
  selectedResults: Set<string>;
  searchId?: string;
}

const ITEMS_PER_PAGE = 10;

const EnhancedSearchResults = ({ results, onResultSelect, selectedResults, searchId }: EnhancedSearchResultsProps) => {
  const [sortBy, setSortBy] = useState<'overall_score' | 'website_quality' | 'digital_presence'>('overall_score');
  const [filterBy, setFilterBy] = useState<'all' | 'poor' | 'fair' | 'good'>('all');
  const [pageAnalysis, setPageAnalysis] = useState<Record<number, PageAnalysisProgress>>({});
  const [analyzingPages, setAnalyzingPages] = useState<Set<number>>(new Set());

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-red-600 bg-red-50';
    if (score < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return 'Poor';
    if (score < 60) return 'Fair';
    return 'Good';
  };

  const filteredResults = results.filter(result => {
    const score = result.overall_score || 0;
    if (filterBy === 'poor') return score < 30;
    if (filterBy === 'fair') return score >= 30 && score < 60;
    if (filterBy === 'good') return score >= 60;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    const aScore = a[sortBy] || 0;
    const bScore = b[sortBy] || 0;
    return bScore - aScore; // Descending order
  });

  const pagination = usePagination({
    data: sortedResults,
    itemsPerPage: ITEMS_PER_PAGE
  });

  // Load page analysis status when page changes
  useEffect(() => {
    if (searchId && !pageAnalysis[pagination.currentPage]) {
      loadPageAnalysisStatus(pagination.currentPage);
    }
  }, [pagination.currentPage, searchId]);

  // Automatically analyze page when user navigates to it
  useEffect(() => {
    if (searchId && !analyzingPages.has(pagination.currentPage)) {
      const currentPageProgress = pageAnalysis[pagination.currentPage];
      // Only analyze if page hasn't been analyzed yet
      if (currentPageProgress && currentPageProgress.status === 'pending') {
        analyzeCurrentPageAutomatically();
      }
    }
  }, [pagination.currentPage, pageAnalysis]);

  const loadPageAnalysisStatus = async (page: number) => {
    if (!searchId) return;
    
    try {
      const progress = await OnDemandAnalysisService.getPageAnalysisProgress(searchId, page, ITEMS_PER_PAGE);
      setPageAnalysis(prev => ({
        ...prev,
        [page]: progress
      }));
    } catch (error) {
      console.error('Failed to load page analysis status:', error);
    }
  };

  const analyzeCurrentPageAutomatically = async () => {
    if (!searchId || analyzingPages.has(pagination.currentPage)) return;
    
    setAnalyzingPages(prev => new Set(prev).add(pagination.currentPage));
    
    try {
      await OnDemandAnalysisService.analyzePageResults(searchId, pagination.currentPage, ITEMS_PER_PAGE);
      
      // Poll for updates
      const pollInterval = setInterval(async () => {
        const progress = await OnDemandAnalysisService.getPageAnalysisProgress(searchId, pagination.currentPage, ITEMS_PER_PAGE);
        setPageAnalysis(prev => ({
          ...prev,
          [pagination.currentPage]: progress
        }));
        
        if (progress.status === 'complete' || progress.status === 'failed') {
          clearInterval(pollInterval);
          setAnalyzingPages(prev => {
            const newSet = new Set(prev);
            newSet.delete(pagination.currentPage);
            return newSet;
          });
          // Refresh the page to show updated results
          window.location.reload();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to analyze page:', error);
      setAnalyzingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pagination.currentPage);
        return newSet;
      });
    }
  };

  const currentPageAnalysis = pageAnalysis[pagination.currentPage];
  const isAnalyzingCurrentPage = analyzingPages.has(pagination.currentPage);

  const renderPaginationItems = () => {
    const items = [];
    const { currentPage, totalPages, goToPage } = pagination;
    
    // Show first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => goToPage(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        items.push(<PaginationEllipsis key="ellipsis1" />);
      }
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => goToPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(<PaginationEllipsis key="ellipsis2" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => goToPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="space-y-4">
      {/* Page Analysis Status */}
      {searchId && (currentPageAnalysis || isAnalyzingCurrentPage) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Enhanced Analysis (Page {pagination.currentPage})
                </CardTitle>
                <CardDescription>
                  AI-powered analysis with Brave Search, Firecrawl, and OpenAI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {currentPageAnalysis && (
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Page Progress</span>
                  <span>{Math.round((currentPageAnalysis.completed / currentPageAnalysis.total) * 100)}%</span>
                </div>
                <Progress value={(currentPageAnalysis.completed / currentPageAnalysis.total) * 100} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Total: {currentPageAnalysis.total}</span>
                  <span>Complete: {currentPageAnalysis.completed}</span>
                  <span>Analyzing: {currentPageAnalysis.analyzing}</span>
                  <span>Failed: {currentPageAnalysis.failed}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall_score">Overall Score</SelectItem>
              <SelectItem value="website_quality">Website Quality</SelectItem>
              <SelectItem value="digital_presence">Digital Presence</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="poor">Poor (0-29)</SelectItem>
              <SelectItem value="fair">Fair (30-59)</SelectItem>
              <SelectItem value="good">Good (60-100)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {pagination.startIndex}-{pagination.endIndex} of {sortedResults.length} results
          (Page {pagination.currentPage} of {pagination.totalPages})
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={pagination.previousPage}
                className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext 
                onClick={pagination.nextPage}
                className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pagination.currentItems.map((result) => {
          const overallScore = result.overall_score || 0;
          const websiteScore = result.website_quality_score || 0;
          const digitalScore = result.digital_presence_score || 0;
          const seoScore = result.seo_score || 0;
          const isAnalyzing = result.analysis_status === 'analyzing' || isAnalyzingCurrentPage;
          const isComplete = result.analysis_status === 'complete';

          return (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.id)}
                      onChange={(e) => onResultSelect(result.id, e.target.checked)}
                      className="rounded border-gray-300 h-4 w-4"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{result.business_name}</CardTitle>
                      {result.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {result.address}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={`${getScoreColor(overallScore)} px-2 py-1`}>
                      {getScoreLabel(overallScore)} ({overallScore}/100)
                    </Badge>
                    {isAnalyzing && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Zap className="h-3 w-3 animate-pulse" />
                        Analyzing...
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  {result.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{result.phone}</span>
                    </div>
                  )}
                  {result.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{result.email}</span>
                    </div>
                  )}
                  {result.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={result.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Enhanced Scoring Breakdown */}
                {isComplete && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Score Breakdown
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Website Quality</span>
                        <span className="font-medium">{websiteScore}/40</span>
                      </div>
                      <Progress value={(websiteScore / 40) * 100} className="h-1" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Digital Presence</span>
                        <span className="font-medium">{digitalScore}/30</span>
                      </div>
                      <Progress value={(digitalScore / 30) * 100} className="h-1" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>SEO Score</span>
                        <span className="font-medium">{seoScore}/30</span>
                      </div>
                      <Progress value={(seoScore / 30) * 100} className="h-1" />
                    </div>
                  </div>
                )}

                {/* Basic info for non-analyzed results */}
                {!isComplete && !isAnalyzing && (
                  <div className="text-sm text-muted-foreground">
                    Enhanced analysis will start automatically when you view this page.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination Controls - Bottom */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={pagination.previousPage}
                className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext 
                onClick={pagination.nextPage}
                className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {sortedResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearchResults;
