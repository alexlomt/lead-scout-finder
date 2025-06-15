
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SearchDashboard from "@/components/SearchDashboard";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <SearchDashboard />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
