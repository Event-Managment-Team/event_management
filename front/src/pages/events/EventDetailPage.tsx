import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Monitor,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Event, GroupStatistic } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const typeIcons: Record<Event["type"], typeof Globe> = {
  online: Monitor,
  offline: Building2,
  hybrid: Globe,
};

const formatDateTime = (value?: string) => {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "EEE, MMM d, yyyy · h:mm a");
};

const formatAgendaTime = (value?: string) => {
  if (!value) return "TBD";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, "h:mm a");
  }

  const parts = value.split(":");
  if (parts.length >= 2) {
    const hours = Number(parts[0]);
    const minutes = parts[1];
    if (!Number.isNaN(hours)) {
      const period = hours >= 12 ? "PM" : "AM";
      const normalizedHours = hours % 12 || 12;
      return `${normalizedHours}:${minutes.slice(0, 2)} ${period}`;
    }
  }

  return value;
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [groupName, setGroupName] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

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
    mutationFn: (data: { event: number; group_name?: string }) => eventService.joinEvent(data),
    onSuccess: () => {
      toast.success("You've joined the event!");
      setJoinOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: AxiosError<ApiError>) => {
      const msg = err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response.data as Record<string, string[]>).flat().join(", ")
          : "Failed to join");
      toast.error(msg);
    },
  });

  const handleJoin = () => {
    if (!event) return;
    joinMutation.mutate({
      event: event.id,
      ...(groupName.trim() ? { group_name: groupName.trim() } : {}),
    });
  };

  const maxGroupCount = useMemo(() => {
    if (!stats?.length) return 1;
    return Math.max(...stats.map((item) => item.count), 1);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="container max-w-6xl space-y-6 py-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
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
  const safeCapacity = Math.max(event.max_participants, 1);
  const capacityPercent = Math.min(100, Math.round((event.participant_count / safeCapacity) * 100));
  const spotsLeft = Math.max(event.max_participants - event.participant_count, 0);
  const locationParts = [
    event.building,
    event.floor ? `Floor ${event.floor}` : null,
    event.room ? `Room ${event.room}` : null,
  ].filter(Boolean);

  return (
    <div className="container max-w-6xl space-y-6 py-8 animate-fade-in">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/events")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
      </Button>

      <section>
        <Card className="border-border/70 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-7">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                <TypeIcon className="mr-1 h-3.5 w-3.5" /> {event.type}
              </Badge>
              <Badge variant="outline" className="capitalize">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {event.visibility}
              </Badge>
              {event.is_joined && <Badge className="bg-emerald-500 text-white">Joined</Badge>}
              {isFull && !event.is_joined && <Badge variant="destructive">Full</Badge>}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Organized by <span className="font-medium text-slate-900">{event.organizer}</span>
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
                <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" /> Starts
                </p>
                <p className="font-medium text-slate-900">{formatDateTime(event.start_date)}</p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
                <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </p>
                <p className="font-medium text-slate-900">
                  {locationParts.length ? locationParts.join(", ") : event.type === "online" ? "Online event" : "TBA"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-slate-50 p-3">
              <p className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Capacity
                </span>
                <span className="font-semibold text-slate-900">
                  {event.participant_count}/{event.max_participants}
                </span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn("h-full rounded-full", isFull ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {isFull ? "No spots left" : `${spotsLeft} spots left`}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="border-border/70 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{event.description}</p>
            </CardContent>
          </Card>

          {event.agenda && event.agenda.length > 0 && (
            <Card className="border-border/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" /> Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.agenda.map((item, index) => (
                  <div key={item.id} className="relative flex gap-4 pl-5">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    {index !== event.agenda.length - 1 && (
                      <span className="absolute left-[4.5px] top-5 h-[calc(100%-10px)] w-px bg-border" />
                    )}
                    <div className="min-w-[88px] text-xs font-medium text-slate-500">
                      {formatAgendaTime(item.start_time)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      {item.description ? <p className="mt-0.5 text-sm text-slate-600">{item.description}</p> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {event.images && event.images.length > 0 && (
            <Card className="border-border/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {event.images.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      className="overflow-hidden rounded-lg border border-border/70 bg-slate-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() =>
                        setPreviewImage({
                          src: img.image,
                          alt: `${event.title} image ${index + 1}`,
                        })
                      }
                    >
                      <img
                        src={img.image}
                        alt={`${event.title} image ${index + 1}`}
                        className="aspect-[4/3] w-full cursor-zoom-in object-cover transition-transform duration-200 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                <Dialog
                  open={Boolean(previewImage)}
                  onOpenChange={(open) => {
                    if (!open) {
                      setPreviewImage(null);
                    }
                  }}
                >
                  <DialogContent className="max-w-4xl border-border bg-white p-2 sm:p-3">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-medium text-slate-700">
                        {previewImage?.alt ?? "Image preview"}
                      </DialogTitle>
                    </DialogHeader>
                    {previewImage ? (
                      <img
                        src={previewImage.src}
                        alt={previewImage.alt}
                        className="max-h-[78vh] w-full rounded-md bg-slate-100 object-contain"
                      />
                    ) : null}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-border/70 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Attend this event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.is_joined ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <p className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> You already joined this event.
                  </p>
                </div>
              ) : isFull ? (
                <Button disabled className="w-full">Event is full</Button>
              ) : (
                <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <UserPlus className="h-4 w-4 mr-2" /> Join event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join "{event.title}"</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Group name (optional)</label>
                        <Input
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="e.g. CS-301"
                        />
                      </div>
                      <Button onClick={handleJoin} disabled={joinMutation.isPending} className="w-full">
                        {joinMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <div className="space-y-2 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Starts</p>
                  <p className="font-medium text-slate-900">{formatDateTime(event.start_date)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Ends</p>
                  <p className="font-medium text-slate-900">{formatDateTime(event.end_date)}</p>
                </div>
              </div>

              {user?.is_staff && (
                <Button variant="outline" className="w-full" onClick={() => navigate(`/events/${event.id}/edit`)}>
                  Edit event <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {stats && stats.length > 0 && (
            <Card className="border-border/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" /> Group statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.map((item) => {
                  const ratio = Math.round((item.count / maxGroupCount) * 100);
                  return (
                    <div key={item.group_name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.group_name || "General"}</span>
                        <span className="text-slate-600">{item.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {event.allowed_roles && event.allowed_roles.length > 0 && (
            <Card className="border-border/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Allowed roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {event.allowed_roles.map((role) => (
                    <Badge key={role.id} variant="outline" className="rounded-full bg-white text-slate-600">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventDetailPage;
