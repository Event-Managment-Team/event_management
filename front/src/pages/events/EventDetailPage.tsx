import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CalendarDays, MapPin, Users, Monitor, Building2, Globe,
  ArrowLeft, Loader2, UserPlus, BarChart3, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Event, GroupStatistic } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const typeIcons = { online: Monitor, offline: Building2, hybrid: Globe };

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [groupName, setGroupName] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await eventService.getById(Number(id));
      return res.data as Event;
    },
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["event-stats", id],
    queryFn: async () => {
      const res = await eventService.getGroupStatistics(Number(id));
      return res.data as GroupStatistic[];
    },
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: (data: { event: number; group_name?: string }) =>
      eventService.joinEvent(data),
    onSuccess: () => {
      toast.success("You've joined the event!");
      setJoinOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: AxiosError<ApiError>) => {
      const msg = err.response?.data?.detail ||
        (typeof err.response?.data === "object" ? Object.values(err.response.data as Record<string, string[]>).flat().join(", ") : "Failed to join");
      toast.error(msg);
    },
  });

  const handleJoin = () => {
    if (!event) return;
    joinMutation.mutate({
      event: event.id,
      ...(groupName ? { group_name: groupName } : {}),
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center text-muted-foreground">
        <p>Event not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/events")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to events
        </Button>
      </div>
    );
  }

  const TypeIcon = typeIcons[event.type] || Globe;
  const isFull = event.participant_count >= event.max_participants;

  return (
    <div className="container py-8 max-w-3xl animate-fade-in">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate("/events")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary" className="capitalize flex items-center gap-1">
            <TypeIcon className="h-3 w-3" /> {event.type}
          </Badge>
          {event.is_joined && <Badge className="bg-success text-success-foreground">Joined</Badge>}
          {isFull && !event.is_joined && <Badge variant="destructive">Full</Badge>}
        </div>
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-muted-foreground mt-1">Organized by {event.organizer}</p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{format(new Date(event.start_date), "MMM d, yyyy · h:mm a")}</p>
              <p className="text-muted-foreground">to {format(new Date(event.end_date), "MMM d, yyyy · h:mm a")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{event.participant_count} / {event.max_participants} participants</p>
              <p className="text-muted-foreground">{event.max_participants - event.participant_count} spots left</p>
            </div>
          </CardContent>
        </Card>
        {(event.building || event.room) && (
          <Card className="sm:col-span-2">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-medium">
                {[event.building, event.floor && `Floor ${event.floor}`, event.room && `Room ${event.room}`].filter(Boolean).join(", ")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </CardContent>
      </Card>

      {/* Roles */}
      {event.allowed_roles && event.allowed_roles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Open to</h3>
          <div className="flex flex-wrap gap-1.5">
            {event.allowed_roles.map((role) => (
              <Badge key={role.id} variant="outline">{role.name}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      {event.agenda && event.agenda.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Agenda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.agenda.map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <div className="text-muted-foreground w-24 shrink-0 font-mono text-xs pt-0.5">
                  {format(new Date(item.start_time), "h:mm a")}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {event.images && event.images.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {event.images.map((img) => (
              <img key={img.id} src={img.image} alt="" className="rounded-lg object-cover aspect-video w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Group stats */}
      {stats && stats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Group Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.map((s) => (
                <div key={s.group_name} className="flex justify-between text-sm">
                  <span>{s.group_name}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join button */}
      {!event.is_joined && !isFull && (
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" /> Join Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join "{event.title}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group name (optional)</label>
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. CS-301" />
              </div>
              <Button onClick={handleJoin} disabled={joinMutation.isPending} className="w-full">
                {joinMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Admin actions */}
      {user?.is_staff && (
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}/edit`)}>
            Edit event
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
