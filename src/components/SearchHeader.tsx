
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <SearchIcon className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">HTMLScout</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SearchHeader;
