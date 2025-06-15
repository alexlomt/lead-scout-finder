
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  searches: number;
  exports: number;
  features: PlanFeature[];
  stripePriceId: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    searches: 5,
    exports: 10,
    stripePriceId: '',
    features: [
      { name: '5 searches per month', included: true },
      { name: '10 row exports', included: true },
      { name: 'Basic support', included: true },
      { name: 'Advanced filters', included: false },
      { name: 'Priority support', included: false },
    ]
  },
  {
    id: 'base',
    name: 'Base',
    price: 49,
    interval: 'month',
    searches: 50,
    exports: 500,
    stripePriceId: 'price_1RaNJYKS91JZt4kjU5Nbnw0i',
    features: [
      { name: '50 searches per month', included: true },
      { name: '500 row exports', included: true },
      { name: 'Advanced filters', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    interval: 'month',
    searches: 200,
    exports: 2000,
    stripePriceId: 'price_1RaNLUKS91JZt4kjkisfSqKz',
    popular: true,
    features: [
      { name: '200 searches per month', included: true },
      { name: '2,000 row exports', included: true },
      { name: 'Advanced filters', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
    ]
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 199,
    interval: 'month',
    searches: 500,
    exports: 999999,
    stripePriceId: 'price_1RaNM8KS91JZt4kjz3KoXyFW',
    features: [
      { name: '500+ searches per month', included: true },
      { name: 'Unlimited exports', included: true },
      { name: 'Advanced filters', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
      { name: 'White-label options', included: true },
    ]
  }
];

const BillingCard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    if (plan.id === 'free') {
      return;
    }

    setLoading(plan.id);

    try {
      console.log('Calling create-checkout-session function with:', {
        priceId: plan.stripePriceId,
        userId: user.id,
      });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plan.stripePriceId,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      console.log('Function response:', data);

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = profile?.subscription_plan || 'free';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Billing & Plans</h2>
        <p className="text-gray-600">Choose the plan that fits your business needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-accent ring-2 ring-accent/20' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-accent text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {currentPlan === plan.id && (
                  <Badge variant="outline" className="text-xs">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-primary">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500">/{plan.interval}</span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="font-semibold">{plan.searches} searches</p>
                <p className="text-sm text-gray-600">
                  {plan.exports === 999999 ? 'Unlimited' : plan.exports} exports
                </p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check 
                      className={`h-4 w-4 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`} 
                    />
                    <span className={feature.included ? '' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan)}
                disabled={loading === plan.id || currentPlan === plan.id}
                className="w-full"
                variant={currentPlan === plan.id ? "outline" : "default"}
              >
                {loading === plan.id ? (
                  "Processing..."
                ) : currentPlan === plan.id ? (
                  "Current Plan"
                ) : plan.id === 'free' ? (
                  "Get Started"
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your current plan usage and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Searches Used</p>
                <p className="text-2xl font-bold text-primary">
                  {profile.searches_used} / {profile.searches_limit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Current Plan</p>
                <p className="text-2xl font-bold text-primary capitalize">
                  {profile.subscription_plan}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingCard;
