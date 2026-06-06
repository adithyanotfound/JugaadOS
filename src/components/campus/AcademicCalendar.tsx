"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Trash2,
  Clock,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";

interface CalendarEvent {
  _id: string;
  classroomId: string;
  classroomName: string;
  subject: string;
  title: string;
  description: string;
  type: "assignment" | "test" | "timetable" | "datesheet" | "holiday" | "other";
  dueDate: string;
  createdByName: string;
}

interface Classroom {
  _id: string;
  name: string;
  subject: string;
}

interface Props {
  role: "teacher" | "student";
  classrooms?: Classroom[];
}

const EVENT_TYPE_CONFIG = {
  assignment: { label: "Assignment", color: "bg-blue-500", light: "bg-blue-100 text-blue-700", emoji: "📝" },
  test: { label: "Test / Exam", color: "bg-red-500", light: "bg-red-100 text-red-700", emoji: "📊" },
  timetable: { label: "Timetable", color: "bg-purple-500", light: "bg-purple-100 text-purple-700", emoji: "📅" },
  datesheet: { label: "Datesheet", color: "bg-orange-500", light: "bg-orange-100 text-orange-700", emoji: "🗓️" },
  holiday: { label: "Holiday", color: "bg-green-500", light: "bg-green-100 text-green-700", emoji: "🌴" },
  other: { label: "Other", color: "bg-gray-500", light: "bg-gray-100 text-gray-700", emoji: "📌" },
};

export default function AcademicCalendar({ role, classrooms = [] }: Props) {
  const { data, isLoading, mutate } = useSWR<{ events: CalendarEvent[] }>("/api/events");
  const events = data?.events ?? [];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    classroomId: "",
    title: "",
    description: "",
    type: "assignment" as CalendarEvent["type"],
    dueDate: "",
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const key = format(new Date(event.dueDate), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const selectedDateEvents = selectedDate
    ? (eventsByDate[format(selectedDate, "yyyy-MM-dd")] ?? [])
    : [];

  const upcomingEvents = events
    .filter(e => new Date(e.dueDate) >= new Date())
    .slice(0, 8);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.dueDate || !newEvent.classroomId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/classrooms/${newEvent.classroomId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          dueDate: new Date(newEvent.dueDate).toISOString(),
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to add event"); return; }
      mutate({ events: [...events, d.event] }, { revalidate: false });
      setNewEvent({ classroomId: "", title: "", description: "", type: "assignment", dueDate: "" });
      setAddOpen(false);
      toast.success("Event added!");
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      const res = await fetch(`/api/classrooms/${event.classroomId}/events?eventId=${event._id}`, {
        method: "DELETE",
      });
      if (!res.ok) { toast.error("Failed to delete event"); return; }
      mutate({ events: events.filter(e => e._id !== event._id) }, { revalidate: false });
      toast.success("Event deleted!");
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100 shadow-none">
            <CardContent className="p-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="font-bold text-black text-lg">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                <div className="flex items-center gap-2">
                  {role === "teacher" && classrooms.length > 0 && (
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                      <DialogTrigger
                        render={
                          <Button size="sm" className="btn-yellow border-0 font-semibold gap-1 text-xs">
                            <Plus size={13} /> Add Event
                          </Button>
                        }
                      />
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Calendar Event</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddEvent} className="space-y-4 py-2">
                          <div className="space-y-1.5">
                            <Label>Classroom *</Label>
                            <select
                              value={newEvent.classroomId}
                              onChange={e => setNewEvent(f => ({ ...f, classroomId: e.target.value }))}
                              className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                            >
                              <option value="">Select classroom...</option>
                              {classrooms.map(c => (
                                <option key={c._id} value={c._id}>{c.name} — {c.subject}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Event Type *</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {(Object.keys(EVENT_TYPE_CONFIG) as CalendarEvent["type"][]).map(type => {
                                const cfg = EVENT_TYPE_CONFIG[type];
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNewEvent(f => ({ ...f, type }))}
                                    className={`py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                                      newEvent.type === type
                                        ? "border-yellow-400 bg-yellow-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    {cfg.emoji} {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Title *</Label>
                            <Input
                              placeholder="Event title"
                              value={newEvent.title}
                              onChange={e => setNewEvent(f => ({ ...f, title: e.target.value }))}
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Due Date / Date *</Label>
                            <Input
                              type="datetime-local"
                              value={newEvent.dueDate}
                              onChange={e => setNewEvent(f => ({ ...f, dueDate: e.target.value }))}
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Additional details..."
                              value={newEvent.description}
                              onChange={e => setNewEvent(f => ({ ...f, description: e.target.value }))}
                              className="min-h-[80px] resize-none"
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full h-11 btn-yellow border-0 font-semibold"
                            disabled={submitting}
                          >
                            {submitting ? "Adding..." : "Add Event"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map(day => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate[key] ?? [];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-start p-1 text-sm transition-all duration-200 ${
                        isSelected
                          ? "bg-black text-white"
                          : today
                          ? "bg-yellow-50 border-2 border-yellow-400 text-black"
                          : inMonth
                          ? "hover:bg-gray-50 text-black"
                          : "text-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-semibold text-xs mt-0.5">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-yellow-400" : EVENT_TYPE_CONFIG[ev.type].color
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 flex-wrap mt-4 pt-4 border-t border-gray-100">
                {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEvent["type"], typeof EVENT_TYPE_CONFIG.assignment][]).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    {cfg.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — selected date events + upcoming */}
        <div className="space-y-4">
          {/* Selected date events */}
          {selectedDate && (
            <Card className="border border-gray-100 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={15} className="text-gray-400" />
                  <h4 className="font-semibold text-black text-sm">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </h4>
                </div>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No events this day</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map(event => {
                      const cfg = EVENT_TYPE_CONFIG[event.type];
                      return (
                        <div key={event._id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 inline-block ${cfg.light}`}>
                                {cfg.emoji} {cfg.label}
                              </span>
                              <p className="text-sm font-semibold text-black line-clamp-2">{event.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{event.classroomName}</p>
                            </div>
                            {role === "teacher" && (
                              <button
                                onClick={() => handleDeleteEvent(event)}
                                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming events */}
          <Card className="border border-gray-100 shadow-none">
            <CardContent className="p-4">
              <h4 className="font-semibold text-black text-sm mb-3 flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                Upcoming
              </h4>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map(event => {
                    const cfg = EVENT_TYPE_CONFIG[event.type];
                    return (
                      <button
                        key={event._id}
                        onClick={() => {
                          setSelectedDate(new Date(event.dueDate));
                          setCurrentDate(new Date(event.dueDate));
                        }}
                        className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-black line-clamp-1">{event.title}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(event.dueDate), "MMM d")} · {event.subject}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
