
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Users, Target, BarChart3, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Smart Local Search",
      description: "Search by city, ZIP code, or radius. Filter by industry to find your perfect prospects."
    },
    {
      icon: Target,
      title: "Web Presence Analysis",
      description: "Automatically categorize businesses: No site, Social-only, Broken, Placeholder, or Professional."
    },
    {
      icon: Download,
      title: "Export & Save",
      description: "Export results to CSV and save searches for future analysis. Never lose a lead again."
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Track your search history, export limits, and discover your most successful lead sources."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share searches with your team and collaborate on lead generation campaigns."
    },
    {
      icon: Shield,
      title: "Compliance First",
      description: "GDPR compliant with rate limiting and robots.txt respect. Professional and ethical prospecting."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Everything you need to find your next client
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed specifically for developers and agencies who want to scale their outbound prospecting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="bg-accent-50 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
