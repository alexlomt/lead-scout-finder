
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Settings, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AccountSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName,
          last_name: lastName 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        toast.error("Failed to update profile");
        return;
      }

      await refreshProfile();
      toast.success("Profile updated successfully!");
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'free':
        return { name: 'Free', price: '$0', color: 'secondary' };
      case 'base':
        return { name: 'Base', price: '$49', color: 'default' };
      case 'pro':
        return { name: 'Pro', price: '$99', color: 'default' };
      case 'agency':
        return { name: 'Agency', price: '$199', color: 'default' };
      default:
        return { name: 'Free', price: '$0', color: 'secondary' };
    }
  };

  const planDetails = getPlanDetails(profile?.subscription_plan || 'free');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <Settings className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-primary">HTMLScout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your account information and subscription
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{user?.email}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Contact support to change your email address
                </p>
              </div>

              <Button 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="w-full md:w-auto"
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Usage
              </CardTitle>
              <CardDescription>
                View your current plan and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Current Plan</h3>
                  <Badge variant={planDetails.color as any}>
                    {planDetails.name} - {planDetails.price}/month
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {profile?.subscription_plan === 'free' 
                    ? "You're currently on the free plan. Upgrade to unlock more features."
                    : "Thank you for being a premium subscriber!"
                  }
                </p>
              </div>

              <Separator />

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Search Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Searches Used</span>
                      <span>{profile?.searches_used || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Searches Limit</span>
                      <span>{profile?.searches_limit || 5}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, ((profile?.searches_used || 0) / (profile?.searches_limit || 5)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Export Limits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Export Limit</span>
                      <span>{profile?.exports_limit || 10} rows</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Per export</span>
                      <span>CSV format</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Created */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Account created: {new Date(profile?.created_at || '').toLocaleDateString()}</span>
              </div>

              {/* Upgrade/Manage Plan */}
              <div className="pt-4">
                {profile?.subscription_plan === 'free' ? (
                  <Button className="w-full md:w-auto">
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full md:w-auto">
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;
