import { TaskCard } from "./TaskCard";

interface Task {
  id: string;
  task: string;
  scheduled_time: string;
  duration?: number;
  notes?: string;
  status: "pending" | "done" | "past";
}

interface TaskListProps {
  tasks: Task[];
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskList = ({ tasks, onMarkDone, onDelete }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No tasks yet. Add your first task to get started!</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const doneTasks = tasks.filter(t => t.status === "done");
  const pastTasks = tasks.filter(t => t.status === "past");

  return (
    <div className="space-y-8">
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-pending rounded-full" />
            Upcoming Tasks ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <TaskCard
                key={task.id}
                id={task.id}
                task={task.task}
                scheduledTime={task.scheduled_time}
                duration={task.duration || undefined}
                notes={task.notes || undefined}
                status={task.status}
                onMarkDone={onMarkDone}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-done rounded-full" />
            Completed Tasks ({doneTasks.length})
          </h2>
          <div className="space-y-3">
            {doneTasks.map(task => (
              <TaskCard
                key={task.id}
                id={task.id}
                task={task.task}
                scheduledTime={task.scheduled_time}
                duration={task.duration || undefined}
                notes={task.notes || undefined}
                status={task.status}
                onMarkDone={onMarkDone}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {pastTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-muted-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-past rounded-full" />
            Past Tasks ({pastTasks.length})
          </h2>
          <div className="space-y-3">
            {pastTasks.map(task => (
              <TaskCard
                key={task.id}
                id={task.id}
                task={task.task}
                scheduledTime={task.scheduled_time}
                duration={task.duration || undefined}
                notes={task.notes || undefined}
                status={task.status}
                onMarkDone={onMarkDone}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
