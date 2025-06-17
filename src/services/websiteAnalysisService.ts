
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
      // Get all search results that need analysis
      const { data: results, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId)
        .in('analysis_status', ['pending', 'basic_complete']);

      if (error || !results?.length) {
        console.log('No results to analyze or error:', error);
        return;
      }

      console.log(`Starting enhanced analysis for ${results.length} businesses`);

      // Update all results to analyzing status
      await supabase
        .from('search_results')
        .update({ analysis_status: 'analyzing' })
        .eq('search_id', searchId)
        .in('analysis_status', ['pending', 'basic_complete']);

      // Process each result (we could batch this in the future)
      for (const result of results) {
        try {
          await this.analyzeIndividualResult(result);
          // Small delay to avoid overwhelming APIs
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`Failed to analyze ${result.business_name}:`, error);
          
          // Mark as failed but don't stop the entire process
          await supabase
            .from('search_results')
            .update({ analysis_status: 'failed' })
            .eq('id', result.id);
        }
      }

      console.log('Enhanced analysis batch complete');
    } catch (error) {
      console.error('Failed to start enhanced analysis:', error);
    }
  }

  static async analyzeIndividualResult(result: any): Promise<AnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-website-presence', {
        body: {
          searchResultId: result.id,
          businessName: result.business_name,
          website: result.website,
          address: result.address
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Analysis failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAnalysisProgress(searchId: string): Promise<{
    total: number;
    pending: number;
    analyzing: number;
    complete: number;
    failed: number;
  }> {
    const { data, error } = await supabase
      .from('search_results')
      .select('analysis_status')
      .eq('search_id', searchId);

    if (error || !data) {
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
  }
}
