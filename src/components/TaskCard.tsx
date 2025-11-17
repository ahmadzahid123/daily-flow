import { format } from "date-fns";
import { Check, Clock, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  task: string;
  scheduledTime: string;
  duration?: number;
  notes?: string;
  status: "pending" | "done" | "past";
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = ({
  id,
  task,
  scheduledTime,
  duration,
  notes,
  status,
  onMarkDone,
  onDelete,
}: TaskCardProps) => {
  const time = new Date(scheduledTime);
  const formattedTime = format(time, "h:mm a");
  const formattedDate = format(time, "MMM dd, yyyy");

  const statusConfig = {
    pending: {
      badge: "pending",
      badgeText: "Pending",
      icon: Clock,
    },
    done: {
      badge: "done",
      badgeText: "Done",
      icon: Check,
    },
    past: {
      badge: "past",
      badgeText: "Past",
      icon: Calendar,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn(
      "p-4 border transition-all hover:shadow-md",
      status === "done" && "bg-done/5 border-done/20",
      status === "pending" && "bg-pending/5 border-pending/20",
      status === "past" && "bg-muted border-border opacity-70"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn(
              "h-4 w-4",
              status === "done" && "text-done",
              status === "pending" && "text-pending",
              status === "past" && "text-past"
            )} />
            <h3 className={cn(
              "font-semibold text-foreground",
              status === "done" && "line-through text-muted-foreground"
            )}>
              {task}
            </h3>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium">{formattedTime}</span>
            <span>•</span>
            <span>{formattedDate}</span>
            {duration && (
              <>
                <span>•</span>
                <span>{duration} min</span>
              </>
            )}
          </div>

          {notes && (
            <p className="text-sm text-muted-foreground mt-2">{notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge 
            variant="outline"
            className={cn(
              status === "done" && "bg-done text-done-foreground border-done",
              status === "pending" && "bg-pending text-pending-foreground border-pending",
              status === "past" && "bg-past text-past-foreground border-past"
            )}
          >
            {config.badgeText}
          </Badge>
          
          <div className="flex gap-2">
            {status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkDone(id)}
                className="h-8 bg-done/10 hover:bg-done/20 text-done border-done/30"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(id)}
              className="h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
