
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  success: boolean;
  scores?: {
    websiteQuality: number;
    digitalPresence: number;
    seo: number;
    overall: number;
  };
  error?: string;
}

export class WebsiteAnalysisService {
  static async analyzeSearchResults(searchId: string): Promise<void> {
    try {
      console.log(`Starting enhanced analysis for search ${searchId}`);
      
      // Get all search results that need analysis
      const { data: results, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId)
        .in('analysis_status', ['pending', 'basic_complete']);

      if (error) {
        console.error('Error fetching results for analysis:', error);
        return;
      }

      if (!results?.length) {
        console.log('No results found that need enhanced analysis');
        return;
      }

      console.log(`Found ${results.length} businesses to analyze`);

      // Update all results to analyzing status first
      const { error: updateError } = await supabase
        .from('search_results')
        .update({ analysis_status: 'analyzing' })
        .eq('search_id', searchId)
        .in('analysis_status', ['pending', 'basic_complete']);

      if (updateError) {
        console.error('Error updating analysis status:', updateError);
        return;
      }

      // Process each result individually with proper error handling
      let completedCount = 0;
      let failedCount = 0;

      for (const result of results) {
        try {
          console.log(`Analyzing business: ${result.business_name}`);
          
          const analysisResult = await this.analyzeIndividualResult(result);
          
          if (analysisResult.success) {
            completedCount++;
            console.log(`Successfully analyzed: ${result.business_name}`);
          } else {
            failedCount++;
            console.error(`Failed to analyze ${result.business_name}:`, analysisResult.error);
            
            // Mark individual result as failed
            await supabase
              .from('search_results')
              .update({ analysis_status: 'failed' })
              .eq('id', result.id);
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          failedCount++;
          console.error(`Exception analyzing ${result.business_name}:`, error);
          
          // Mark as failed
          await supabase
            .from('search_results')
            .update({ analysis_status: 'failed' })
            .eq('id', result.id);
        }
      }

      console.log(`Enhanced analysis complete. Completed: ${completedCount}, Failed: ${failedCount}`);
      
    } catch (error) {
      console.error('Failed to start enhanced analysis:', error);
    }
  }

  static async analyzeIndividualResult(result: any): Promise<AnalysisResult> {
    try {
      console.log(`Calling edge function for: ${result.business_name}`);
      
      const { data, error } = await supabase.functions.invoke('analyze-website-presence', {
        body: {
          searchResultId: result.id,
          businessName: result.business_name,
          website: result.website,
          address: result.address
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Edge function call failed');
      }

      if (!data) {
        throw new Error('No data returned from analysis');
      }

      return data;
    } catch (error) {
      console.error('Analysis failed for', result.business_name, ':', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  static async getAnalysisProgress(searchId: string): Promise<{
    total: number;
    pending: number;
    analyzing: number;
    complete: number;
    failed: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('analysis_status')
        .eq('search_id', searchId);

      if (error || !data) {
        console.error('Error fetching analysis progress:', error);
        return { total: 0, pending: 0, analyzing: 0, complete: 0, failed: 0 };
      }

      const statusCounts = data.reduce((acc, result) => {
        const status = result.analysis_status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: data.length,
        pending: (statusCounts.pending || 0) + (statusCounts.basic_complete || 0),
        analyzing: statusCounts.analyzing || 0,
        complete: statusCounts.complete || 0,
        failed: statusCounts.failed || 0
      };
    } catch (error) {
      console.error('Failed to get analysis progress:', error);
      return { total: 0, pending: 0, analyzing: 0, complete: 0, failed: 0 };
    }
  }
}
