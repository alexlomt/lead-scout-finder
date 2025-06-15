
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out HTMLScout",
      features: [
        "5 searches per month",
        "Basic web presence analysis",
        "CSV export (25 results)",
        "Email support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Base",
      price: "$49",
      period: "per month",
      description: "Great for freelancers and small teams",
      features: [
        "100 searches per month",
        "Advanced web presence analysis",
        "CSV export (1,000 results)",
        "Saved searches",
        "Priority email support",
        "Industry filtering"
      ],
      cta: "Start Base Plan",
      popular: true
    },
    {
      name: "Pro",
      price: "$99",
      period: "per month",
      description: "Perfect for growing agencies",
      features: [
        "500 searches per month",
        "All Base features",
        "CSV export (5,000 results)",
        "Team collaboration",
        "API access",
        "Phone support",
        "Custom integrations"
      ],
      cta: "Start Pro Plan",
      popular: false
    },
    {
      name: "Agency",
      price: "$199",
      period: "per month",
      description: "For large agencies and enterprises",
      features: [
        "Unlimited searches",
        "All Pro features",
        "Unlimited CSV exports",
        "White-label options",
        "Dedicated account manager",
        "Custom reporting",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business. All plans include our core features with no hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative border-2 hover:shadow-xl transition-shadow duration-300 ${
              plan.popular ? 'border-accent shadow-lg' : 'border-gray-200'
            }`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-primary">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-gray-600 ml-1">/{plan.period}</span>
                </div>
                <CardDescription className="mt-2 text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-accent hover:bg-accent-600 text-white' 
                      : 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
          <p className="text-sm text-gray-500">
            Need a custom plan? <a href="#" className="text-accent hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
