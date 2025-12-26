import { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  taskName: string;
  scheduledTime: string;
  notes?: string;
}

export const NotificationModal = ({
  isOpen,
  onClose,
  title,
  taskName,
  scheduledTime,
  notes,
}: NotificationModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  // Parse notes for bullet points if available
  const formatNotes = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-card border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
      >
        {/* Header with pulse animation */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AlertCircle className="h-8 w-8 text-primary animate-pulse" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-ping" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scheduledTime}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Task Name */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-lg text-foreground mb-2">📋 Task</h3>
            <p className="text-foreground text-base">{taskName}</p>
          </div>

          {/* Enhanced Notes/Tips */}
          {notes && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                AI-Enhanced Tips & Details
              </h3>
              <div className="space-y-2">
                {formatNotes(notes).map((line, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <p className="text-foreground/90 text-sm leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action reminder */}
          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium text-center">
              ⚠️ This reminder will stay until you dismiss it. Click the X button when done!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t border-border px-6 py-4">
          <Button
            onClick={handleClose}
            className="w-full gap-2"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            Got it, Dismiss Reminder
          </Button>
        </div>
      </div>
    </div>
  );
};
