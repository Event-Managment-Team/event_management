import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CalendarDays } from "lucide-react";
import type { Event } from "@/types";

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-start_date");

  const { data, isLoading } = useQuery({
    queryKey: ["events", search, typeFilter, sortBy],
    queryFn: async () => {
      const params: Record<string, string> = { ordering: sortBy };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await eventService.getAll(params);
      return (res.data.results || res.data) as Event[];
    },
  });

  const events = data || [];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Events
        </h1>
        <p className="text-muted-foreground mt-1">Discover and join campus events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-start_date">Newest first</SelectItem>
            <SelectItem value="start_date">Oldest first</SelectItem>
            <SelectItem value="title">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event list */}
      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}

        {!isLoading && events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No events found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
