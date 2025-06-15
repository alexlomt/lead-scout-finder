
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useState, useEffect } from "react";

interface RateLimitDisplayProps {
  operation: 'search' | 'export';
  className?: string;
}

const RateLimitDisplay = ({ operation, className }: RateLimitDisplayProps) => {
  const { getRemainingTime } = useRateLimit();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateRemainingTime = () => {
      setRemainingTime(getRemainingTime(operation));
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [operation, getRemainingTime]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (remainingTime <= 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Rate Limit Active
        </CardTitle>
        <CardDescription>
          {operation === 'search' ? 'Search' : 'Export'} limit reached
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Reset in: </span>
          <Badge variant="outline">{formatTime(remainingTime)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RateLimitDisplay;
