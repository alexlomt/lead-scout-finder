
import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Search className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">HTMLScout</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">
              Sign In
            </a>
            <Button className="bg-accent hover:bg-accent-600 text-white">
              Start Free Trial
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors py-2">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors py-2">
                Pricing
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors py-2">
                Sign In
              </a>
              <Button className="bg-accent hover:bg-accent-600 text-white mt-2">
                Start Free Trial
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
