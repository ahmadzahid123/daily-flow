import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface TaskInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export const TaskInput = ({ onSubmit, isLoading }: TaskInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput("");
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Add Your Daily Tasks</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Type your entire day's routine in natural language. For example: "Morning jog at 6am, 
          Team meeting at 9:30am, Lunch break at 1pm, Client call at 3pm"
        </p>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Wake up at 6am, breakfast at 7am, gym at 8am, work meeting at 10am, lunch at 1pm..."
          className="min-h-[120px] bg-background border-input text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? "Processing..." : "Add Tasks with AI"}
        </Button>
      </div>
    </Card>
  );
};
