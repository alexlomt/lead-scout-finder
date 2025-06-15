
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { useAdmin } from '@/hooks/useAdmin';

const AdminAuditLogs = () => {
  const { auditLogs } = useAdmin();

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'reset_rate_limits': return 'default';
      case 'change_subscription_plan': return 'secondary';
      default: return 'outline';
    }
  };

  const formatActionName = (action: string) => {
    switch (action) {
      case 'reset_rate_limits': return 'Reset Rate Limits';
      case 'change_subscription_plan': return 'Change Plan';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    if (details.old_plan && details.new_plan) {
      return `${details.old_plan} → ${details.new_plan}`;
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Admin Audit Logs
        </CardTitle>
        <CardDescription>
          Track all administrative actions performed on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {formatActionName(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {log.target_user_id ? log.target_user_id.substring(0, 8) + '...' : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDetails(log.details) || 'No details'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {auditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminAuditLogs;
