
import { supabase } from "@/integrations/supabase/client";

export interface PageAnalysisProgress {
  page: number;
  total: number;
  completed: number;
  analyzing: number;
  failed: number;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
}

export class OnDemandAnalysisService {
  static async analyzePageResults(searchId: string, page: number, itemsPerPage: number = 10): Promise<void> {
    try {
      console.log(`Starting enhanced analysis for search ${searchId}, page ${page}`);
      
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage;
      
      // Get search results for the specific page that need analysis
      const { data: results, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_id', searchId)
        .in('analysis_status', ['pending', 'basic_complete'])
        .range(offset, offset + itemsPerPage - 1)
        .order('overall_score', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching page results for analysis:', error);
        return;
      }

      if (!results?.length) {
        console.log(`No results found on page ${page} that need enhanced analysis`);
        return;
      }

      console.log(`Found ${results.length} businesses to analyze on page ${page}`);

      // Update results to analyzing status
      const resultIds = results.map(r => r.id);
      const { error: updateError } = await supabase
        .from('search_results')
        .update({ analysis_status: 'analyzing' })
        .in('id', resultIds);

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
            failedCount++;
            
            // Mark individual result as failed
            await supabase
              .from('search_results')
              .update({ analysis_status: 'failed' })
              .eq('id', result.id);
          } else if (data?.success) {
            completedCount++;
            console.log(`Successfully analyzed: ${result.business_name}`);
          } else {
            failedCount++;
            console.error(`Failed to analyze ${result.business_name}:`, data?.error);
            
            // Mark individual result as failed
            await supabase
              .from('search_results')
              .update({ analysis_status: 'failed' })
              .eq('id', result.id);
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
          
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

      console.log(`Page ${page} analysis complete. Completed: ${completedCount}, Failed: ${failedCount}`);
      
    } catch (error) {
      console.error(`Failed to analyze page ${page}:`, error);
    }
  }

  static async getPageAnalysisProgress(searchId: string, page: number, itemsPerPage: number = 10): Promise<PageAnalysisProgress> {
    try {
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage;
      
      const { data, error } = await supabase
        .from('search_results')
        .select('analysis_status')
        .eq('search_id', searchId)
        .range(offset, offset + itemsPerPage - 1)
        .order('overall_score', { ascending: false, nullsFirst: false });

      if (error || !data) {
        console.error('Error fetching page analysis progress:', error);
        return { page, total: 0, completed: 0, analyzing: 0, failed: 0, status: 'pending' };
      }

      const statusCounts = data.reduce((acc, result) => {
        const status = result.analysis_status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = data.length;
      const pending = (statusCounts.pending || 0) + (statusCounts.basic_complete || 0);
      const analyzing = statusCounts.analyzing || 0;
      const completed = statusCounts.complete || 0;
      const failed = statusCounts.failed || 0;

      // Determine overall page status
      let status: 'pending' | 'analyzing' | 'complete' | 'failed' = 'pending';
      if (analyzing > 0) {
        status = 'analyzing';
      } else if (completed === total) {
        status = 'complete';
      } else if (failed === total) {
        status = 'failed';
      } else if (completed + failed === total) {
        status = 'complete'; // Partially complete is considered complete
      }

      return {
        page,
        total,
        completed,
        analyzing,
        failed,
        status
      };
    } catch (error) {
      console.error('Failed to get page analysis progress:', error);
      return { page, total: 0, completed: 0, analyzing: 0, failed: 0, status: 'pending' };
    }
  }
}
