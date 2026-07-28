"use client";

import TaskDayView from "./TaskDayView";
import TaskWeekView from "./TaskWeekView";
import TaskMonthView from "./TaskMonthView";
import TaskYearView from "./TaskYearView";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  dueDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  isDaily: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project: string | null;
  isSop: boolean;
  parentTaskId: string | null;
}

interface TaskScheduleViewProps {
  timeRange: string;
  days: Date[];
  tasksByDate: Record<string, Task[]>;
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  onDateClick: (date: Date, timeRange: string) => void;
  year: number;
}

export default function TaskScheduleView({
  timeRange,
  days,
  tasksByDate,
  filteredTasks,
  childMap,
  onTaskClick,
  onDateClick,
  year,
}: TaskScheduleViewProps) {
  if (timeRange === "day") {
    return <TaskDayView days={days} tasksByDate={tasksByDate} filteredTasks={filteredTasks} childMap={childMap} onTaskClick={onTaskClick} />;
  }
  if (timeRange === "week") {
    return <TaskWeekView days={days} tasksByDate={tasksByDate} filteredTasks={filteredTasks} childMap={childMap} onTaskClick={onTaskClick} />;
  }
  if (timeRange === "month") {
    return <TaskMonthView days={days} tasksByDate={tasksByDate} childMap={childMap} onTaskClick={onTaskClick} onDateClick={onDateClick} />;
  }
  if (timeRange === "year") {
    return <TaskYearView tasksByDate={tasksByDate} year={year} onDateClick={onDateClick} />;
  }
  return <TaskDayView days={days} tasksByDate={tasksByDate} filteredTasks={filteredTasks} childMap={childMap} onTaskClick={onTaskClick} />;
}