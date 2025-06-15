
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Shield } from "lucide-react";
import { useAdmin } from '@/hooks/useAdmin';
import type { Database } from '@/integrations/supabase/types';

type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];

const UserManagementTable = () => {
  const { users, resetUserRateLimit, changeUserPlan, refreshData } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = selectedPlan === 'all' || user.subscription_plan === selectedPlan;
    
    return matchesSearch && matchesPlan;
  });

  const handleResetRateLimit = async (userId: string) => {
    setLoadingActions(prev => ({ ...prev, [`reset_${userId}`]: true }));
    await resetUserRateLimit(userId);
    setLoadingActions(prev => ({ ...prev, [`reset_${userId}`]: false }));
  };

  const handleChangePlan = async (userId: string, newPlan: SubscriptionPlan) => {
    setLoadingActions(prev => ({ ...prev, [`plan_${userId}`]: true }));
    await changeUserPlan(userId, newPlan);
    setLoadingActions(prev => ({ ...prev, [`plan_${userId}`]: false }));
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'free': return 'secondary';
      case 'base': return 'default';
      case 'pro': return 'outline';
      case 'agency': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, subscription plans, and rate limits
            </CardDescription>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      {(user.first_name || user.last_name) && (
                        <div className="text-sm text-muted-foreground">
                          {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                      {user.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Searches: {user.searches_used}/{user.searches_limit}</div>
                      <div className="text-muted-foreground">Exports: {user.exports_limit}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetRateLimit(user.id)}
                        disabled={loadingActions[`reset_${user.id}`]}
                      >
                        {loadingActions[`reset_${user.id}`] ? 'Resetting...' : 'Reset Limits'}
                      </Button>
                      <Select
                        value={user.subscription_plan}
                        onValueChange={(newPlan) => handleChangePlan(user.id, newPlan as SubscriptionPlan)}
                        disabled={loadingActions[`plan_${user.id}`]}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagementTable;
