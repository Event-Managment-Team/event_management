import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CalendarDays, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Event } from "@/types";

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-start_date");

  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await eventService.getAll();
      return (res.data.results || res.data) as Event[];
    },
  });

  const events = useMemo(() => {
    const source = data || [];
    const normalizedSearch = search.trim().toLowerCase();

    let filtered = source.filter((event) => {
      if (typeFilter !== "all" && event.type !== typeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        event.title,
        event.description,
        event.organizer,
        event.building,
        event.room,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      const aStart = new Date(a.start_date).getTime();
      const bStart = new Date(b.start_date).getTime();

      if (sortBy === "start_date") {
        return aStart - bStart;
      }

      return bStart - aStart;
    });

    return filtered;
  }, [data, search, sortBy, typeFilter]);

  const stats = useMemo(() => {
    const source = data || [];

    return {
      total: source.length,
      joined: source.filter((event) => Boolean(event.is_joined)).length,
      online: source.filter((event) => event.type === "online").length,
    };
  }, [data]);

  const hasActiveFilters = Boolean(search.trim()) || typeFilter !== "all" || sortBy !== "-start_date";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSortBy("-start_date");
  };

  return (
    <div className="relative overflow-hidden pb-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/80 blur-3xl" />
      </div>

      <div className="container max-w-6xl space-y-6 py-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.16] via-background to-accent/40 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Campus Picks
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Find Your Next Event</h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Discover workshops, talks, and social experiences happening across campus.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2 text-center backdrop-blur">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">All</p>
                <p className="text-lg font-semibold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2 text-center backdrop-blur">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Joined</p>
                <p className="text-lg font-semibold text-foreground">{stats.joined}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2 text-center backdrop-blur">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Online</p>
                <p className="text-lg font-semibold text-foreground">{stats.online}</p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-primary/20" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full border border-primary/15" />
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Refine Results
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading events..." : `Showing ${events.length} of ${stats.total} events`}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-start_date">Newest first</SelectItem>
                <SelectItem value="start_date">Oldest first</SelectItem>
                <SelectItem value="title">A-Z</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button variant="ghost" onClick={clearFilters} className="w-full lg:w-auto">
                Clear
              </Button>
            ) : (
              <div className="hidden lg:block" />
            )}
          </div>
        </section>

        <section>
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}

            {!isLoading && events.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center text-muted-foreground">
                <CalendarDays className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium text-foreground">No events found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}

            {events.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in [animation-fill-mode:both]"
                style={{ animationDelay: `${Math.min(index * 40, 220)}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EventsPage;
