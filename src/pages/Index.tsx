import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LogOut, Calendar } from "lucide-react";

interface Task {
  id: string;
  task: string;
  scheduled_time: string;
  duration?: number;
  notes?: string;
  status: "pending" | "done" | "past";
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadTasks(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadTasks(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadTasks = async (userId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_time", { ascending: true });

    if (error) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTasks((data || []) as Task[]);
    }
  };

  const handleAddTasks = async (text: string) => {
    setLoading(true);
    try {
      // Call edge function to process tasks with AI
      const { data, error } = await supabase.functions.invoke("extract-tasks", {
        body: { text },
      });

      if (error) throw error;

      if (data?.tasks && data.tasks.length > 0) {
        // Insert tasks into database
        const tasksToInsert = data.tasks.map((task: any) => ({
          user_id: user.id,
          task: task.task,
          scheduled_time: task.time,
          duration: task.duration,
          notes: task.notes,
          status: "pending",
        }));

        const { error: insertError } = await supabase
          .from("tasks")
          .insert(tasksToInsert);

        if (insertError) throw insertError;

        toast({
          title: "Tasks added!",
          description: `Successfully added ${data.tasks.length} tasks.`,
        });

        loadTasks(user.id);
      } else {
        toast({
          title: "No tasks found",
          description: "Could not extract tasks from your input. Try being more specific with times.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Task completed!",
        description: "Great job on finishing your task.",
      });
      loadTasks(user.id);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Task deleted",
        description: "Task has been removed.",
      });
      loadTasks(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Reminder</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM dd, yyyy")}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <TaskInput onSubmit={handleAddTasks} isLoading={loading} />
          <TaskList 
            tasks={tasks}
            onMarkDone={handleMarkDone}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
