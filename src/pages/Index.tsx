import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/TaskList";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LogOut, Calendar as CalendarIcon, Bell, Plus } from "lucide-react";
import { requestNotificationPermission, registerServiceWorker } from "@/lib/notifications";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(format(new Date(), "HH:mm"));
  const [taskText, setTaskText] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadTasks(session.user.id);
        initializeNotifications();
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

  // Check for due tasks every minute and show notifications
  useEffect(() => {
    const checkDueTasks = async () => {
      if (!user) return;
      
      try {
        // Get recently enhanced tasks (within last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: enhancedTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('notified', true)
          .gte('updated_at', twoMinutesAgo)
          .eq('user_id', user.id);

        // Show browser notifications for enhanced tasks
        if (enhancedTasks && enhancedTasks.length > 0 && notificationsEnabled) {
          for (const task of enhancedTasks) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: task.notes || task.task,
                icon: '/favicon.ico',
                tag: task.id
              });
            }
          }
        }

        // Call enhance-and-notify function
        await supabase.functions.invoke('enhance-and-notify');
        
        // Reload tasks to show updates
        loadTasks(user.id);
      } catch (error) {
        console.error('Error checking due tasks:', error);
      }
    };

    // Check immediately on mount
    checkDueTasks();

    // Then check every minute
    const interval = setInterval(checkDueTasks, 60000);

    return () => clearInterval(interval);
  }, [user, notificationsEnabled]);

  const initializeNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission);
    
    if (permission) {
      await registerServiceWorker();
      toast({
        title: "Notifications enabled!",
        description: "You'll receive reminders for your tasks.",
      });
    }
  };

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission);
    
    if (permission) {
      await registerServiceWorker();
      toast({
        title: "Notifications enabled!",
        description: "You'll receive reminders for your tasks.",
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

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

  const handleAddTask = async () => {
    if (!user || !taskText.trim()) return;
    
    setLoading(true);
    try {
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          task: taskText.trim(),
          scheduled_time: scheduledDateTime.toISOString(),
          status: 'pending',
          notified: false
        });

      if (insertError) throw insertError;

      toast({
        title: "Task added",
        description: `Scheduled for ${format(scheduledDateTime, "PPP 'at' p")}`,
      });

      setTaskText("");
      loadTasks(user.id);
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({
        title: "Error adding task",
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
            <CalendarIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Reminder</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM dd, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <Button 
                variant="outline" 
                onClick={handleEnableNotifications}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Task
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-32"
                />
              </div>

              <Input
                placeholder="Enter task description..."
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                disabled={loading}
              />

              <Button 
                onClick={handleAddTask}
                disabled={!taskText.trim() || loading}
                className="w-full"
              >
                {loading ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>

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
