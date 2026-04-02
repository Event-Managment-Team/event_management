import { Link } from "react-router-dom";
import type { Event } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Monitor, Building2, Globe } from "lucide-react";
import { format } from "date-fns";

const typeIcons = {
  online: Monitor,
  offline: Building2,
  hybrid: Globe,
};

const EventCard = ({ event }: { event: Event }) => {
  const TypeIcon = typeIcons[event.type] || Globe;
  const isFull = event.participant_count >= event.max_participants;

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="secondary" className="text-xs capitalize flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                {event.type}
              </Badge>
              {event.is_joined && (
                <Badge className="bg-success text-success-foreground text-xs">Joined</Badge>
              )}
              {isFull && !event.is_joined && (
                <Badge variant="destructive" className="text-xs">Full</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(new Date(event.start_date), "MMM d, yyyy")}
            </span>
            {(event.building || event.room) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[event.building, event.floor, event.room].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.participant_count}/{event.max_participants}
            </span>
          </div>

          {event.allowed_roles && event.allowed_roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {event.allowed_roles.map((role) => (
                <Badge key={role.id} variant="outline" className="text-[10px] font-normal">
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
