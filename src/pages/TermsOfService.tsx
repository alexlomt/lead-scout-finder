
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Search className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-primary">HTMLScout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p><strong>Effective Date:</strong> June 15, 2025</p>
            <p><strong>Last Updated:</strong> June 15, 2025</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using HTMLScout ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                HTMLScout is a web application that helps freelance developers and agencies discover businesses with poor web presence for prospecting purposes. The service provides:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Business search and discovery tools</li>
                <li>Web presence analysis and scoring</li>
                <li>Lead generation and export capabilities</li>
                <li>Search history and management features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-600 mb-4">
                You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Requirements</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>You must be at least 18 years old</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for keeping your information updated</li>
                <li>One account per person or business entity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Plan Types</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li><strong>Free Plan:</strong> 5 searches per month, limited exports</li>
                <li><strong>Base Plan ($49/month):</strong> 50 searches, 500-row exports</li>
                <li><strong>Pro Plan ($99/month):</strong> 200 searches, 2,000-row exports</li>
                <li><strong>Agency Plan ($199/month):</strong> 500+ searches, unlimited exports</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Billing Terms</h3>
              <p className="text-gray-600 mb-4">
                Paid subscriptions are billed monthly in advance. You authorize us to charge your payment method for all fees. Failure to pay may result in service suspension.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Permitted Uses</h3>
              <p className="text-gray-600 mb-4">You may use our service for legitimate business prospecting and lead generation activities.</p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Prohibited Uses</h3>
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Use the service for spam or unsolicited communications</li>
                <li>Circumvent usage limits or restrictions</li>
                <li>Share account credentials with others</li>
                <li>Attempt to access unauthorized areas of the service</li>
                <li>Use automated tools to scrape or harvest data beyond normal use</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Usage and Compliance</h2>
              <p className="text-gray-600 mb-4">
                The business data provided through our service is for prospecting purposes only. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Complying with all applicable privacy laws (GDPR, CCPA, etc.)</li>
                <li>Obtaining proper consent before contacting businesses</li>
                <li>Following CAN-SPAM and similar anti-spam regulations</li>
                <li>Respecting opt-out requests and do-not-contact preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                HTMLScout and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-600 mb-4">
                We strive to maintain high service availability but do not guarantee uninterrupted access. We may suspend service for maintenance, updates, or other operational reasons with reasonable notice when possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                In no event shall HTMLScout be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-600 mb-4">
                We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  <strong>Email:</strong> legal@htmlscout.com<br />
                  <strong>Address:</strong> HTMLScout Legal Team<br />
                  123 Tech Street, Suite 100<br />
                  San Francisco, CA 94105
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
