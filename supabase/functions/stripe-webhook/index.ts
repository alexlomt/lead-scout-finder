
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    const body = await req.text();
    
    // Verify webhook signature (simplified for demo)
    // In production, use proper Stripe webhook verification
    
    const event = JSON.parse(body);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        if (userId) {
          // Determine plan based on price ID
          let plan = 'free';
          if (session.amount_total === 4900) plan = 'base';
          else if (session.amount_total === 9900) plan = 'pro';
          else if (session.amount_total === 19900) plan = 'agency';
          
          // Update user's subscription plan
          await supabase
            .from('profiles')
            .update({ 
              subscription_plan: plan,
              stripe_customer_id: session.customer 
            })
            .eq('id', userId);
        }
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        // Downgrade user to free plan
        await supabase
          .from('profiles')
          .update({ subscription_plan: 'free' })
          .eq('stripe_customer_id', subscription.customer);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
});
