import { Link } from "react-router-dom";
import type { Event } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Users, Monitor, Building2, Globe } from "lucide-react";
import { format } from "date-fns";

const typeIcons = {
  online: Monitor,
  offline: Building2,
  hybrid: Globe,
};

const typeStyles: Record<Event["type"], { ribbon: string; pill: string }> = {
  online: {
    ribbon: "from-sky-500/80 via-sky-400/45 to-cyan-300/35",
    pill: "border-sky-200 bg-sky-100 text-sky-800",
  },
  offline: {
    ribbon: "from-amber-500/80 via-orange-400/45 to-yellow-300/35",
    pill: "border-amber-200 bg-amber-100 text-amber-900",
  },
  hybrid: {
    ribbon: "from-violet-500/80 via-fuchsia-400/45 to-pink-300/35",
    pill: "border-violet-200 bg-violet-100 text-violet-800",
  },
};

const EventCard = ({ event }: { event: Event }) => {
  const TypeIcon = typeIcons[event.type] || Globe;
  const isFull = event.participant_count >= event.max_participants;
  const safeCapacity = Math.max(event.max_participants, 1);
  const capacityPercent = Math.min(100, Math.round((event.participant_count / safeCapacity) * 100));
  const spotsLeft = Math.max(event.max_participants - event.participant_count, 0);
  const location = [
    event.building,
    event.floor ? `Floor ${event.floor}` : null,
    event.room ? `Room ${event.room}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link to={`/events/${event.id}`} className="block h-full">
      <Card className="group h-full overflow-hidden border-border/70 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
        <div className={cn("h-1.5 w-full bg-gradient-to-r", typeStyles[event.type].ribbon)} />
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <Badge
                variant="outline"
                className={cn("w-fit gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", typeStyles[event.type].pill)}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                {event.type}
              </Badge>
              <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground">by {event.organizer}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                {event.visibility}
              </Badge>
              {event.is_joined && (
                <Badge className="bg-success text-success-foreground text-xs">Joined</Badge>
              )}
              {isFull && !event.is_joined && (
                <Badge variant="destructive" className="text-xs">Full</Badge>
              )}
            </div>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>

          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Starts
              </p>
              <p className="font-medium text-foreground">
                {format(new Date(event.start_date), "EEE, MMM d - h:mm a")}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </p>
              <p className="line-clamp-2 font-medium text-foreground">
                {location || (event.type === "online" ? "Online event" : "TBA")}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-3">
            <p className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Capacity
              </span>
              <span className="font-medium text-foreground">
                {event.participant_count}/{event.max_participants}
              </span>
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all duration-500", isFull ? "bg-destructive" : "bg-primary")}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isFull ? "No spots left" : `${spotsLeft} spots left`}
            </p>
          </div>

          {event.allowed_roles && event.allowed_roles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {event.allowed_roles.map((role) => (
                <Badge key={role.id} variant="outline" className="rounded-full bg-background text-[10px] font-medium">
                  {role.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default EventCard;
