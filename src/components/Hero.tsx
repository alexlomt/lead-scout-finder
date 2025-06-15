
import { Button } from "@/components/ui/button";
import { Search, Target, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 animate-fade-in">
            Find clients <span className="text-accent">before</span> they know they need you
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in">
            HTMLScout helps freelance developers and agencies discover businesses with poor web presence. 
            Turn missed opportunities into your next big client.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
            <Button size="lg" className="bg-accent hover:bg-accent-600 text-white px-8 py-3 text-lg">
              Start Free Trial - 5 Searches
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Search className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">10,000+</h3>
              <p className="text-gray-600">Businesses scanned daily</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">85%</h3>
              <p className="text-gray-600">Lead conversion rate</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">500+</h3>
              <p className="text-gray-600">Agencies trust us</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
