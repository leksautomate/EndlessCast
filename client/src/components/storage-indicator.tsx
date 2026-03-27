import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
import type { StorageInfo } from "@shared/schema";
import { formatBytes } from "@shared/schema";

interface StorageIndicatorProps {
  storageInfo: StorageInfo;
}

export function StorageIndicator({ storageInfo }: StorageIndicatorProps) {
  const percentage = (storageInfo.used / storageInfo.limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage > 95;

  return (
    <div className="flex items-center gap-3 min-w-[180px]" data-testid="storage-indicator">
      <HardDrive className={`w-4 h-4 ${isAtLimit ? "text-status-busy" : isNearLimit ? "text-status-away" : "text-muted-foreground"}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Storage</span>
          <span className={`tabular-nums ${isAtLimit ? "text-status-busy" : isNearLimit ? "text-status-away" : "text-foreground"}`}>
            {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={`h-1.5 ${isAtLimit ? "[&>div]:bg-status-busy" : isNearLimit ? "[&>div]:bg-status-away" : ""}`}
        />
      </div>
    </div>
  );
}
