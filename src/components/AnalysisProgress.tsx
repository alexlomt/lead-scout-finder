
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { WebsiteAnalysisService } from "@/services/websiteAnalysisService";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";

interface AnalysisProgressProps {
  searchId: string;
  onAnalysisComplete?: () => void;
}

const AnalysisProgress = ({ searchId, onAnalysisComplete }: AnalysisProgressProps) => {
  const [progress, setProgress] = useState({
    total: 0,
    pending: 0,
    analyzing: 0,
    complete: 0,
    failed: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    updateProgress();
    
    // Poll for progress every 3 seconds while analysis is running
    const interval = setInterval(() => {
      if (progress.analyzing > 0 || progress.pending > 0) {
        updateProgress();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [searchId, progress.analyzing, progress.pending]);

  const updateProgress = async () => {
    try {
      const newProgress = await WebsiteAnalysisService.getAnalysisProgress(searchId);
      setProgress(newProgress);
      
      // Check if analysis is complete
      if (newProgress.total > 0 && newProgress.pending === 0 && newProgress.analyzing === 0) {
        onAnalysisComplete?.();
      }
    } catch (error) {
      console.error('Failed to get progress:', error);
    }
  };

  const refreshProgress = async () => {
    setIsRefreshing(true);
    await updateProgress();
    setIsRefreshing(false);
  };

  const completionPercentage = progress.total > 0 
    ? ((progress.complete + progress.failed) / progress.total) * 100 
    : 0;

  const isAnalyzing = progress.analyzing > 0 || progress.pending > 0;

  if (progress.total === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Enhanced Website Analysis
            </CardTitle>
            <CardDescription>
              AI-powered scoring for better lead qualification
            </CardDescription>
          </div>
          <button
            onClick={refreshProgress}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Pending</span>
            <Badge variant="secondary">{progress.pending}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Analyzing</span>
            <Badge variant="outline">{progress.analyzing}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Complete</span>
            <Badge variant="default">{progress.complete}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Failed</span>
            <Badge variant="destructive">{progress.failed}</Badge>
          </div>
        </div>

        {isAnalyzing && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            🔄 Enhanced analysis is running in the background. Results will update automatically as each business is analyzed.
          </div>
        )}

        {!isAnalyzing && progress.complete > 0 && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            ✅ Enhanced analysis complete! All businesses now have detailed scoring.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisProgress;
