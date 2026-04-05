import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/authStore";
import EventCard from "@/components/events/EventCard.tsx";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  CalendarRange,
  Compass,
  Filter,
  LayoutGrid,
  Lock,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/types";

const typeOptions = [
  { value: "all", label: "All events" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const sortOptions = [
  { value: "-start_date", label: "Newest first" },
  { value: "start_date", label: "Oldest first" },
  { value: "title", label: "A-Z" },
];

const EventsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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

      const haystack = [event.title, event.description, event.organizer, event.building, event.room]
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
    const now = Date.now();

    return {
      total: source.length,
      upcoming: source.filter((event) => new Date(event.start_date).getTime() >= now).length,
      joined: source.filter((event) => Boolean(event.is_joined)).length,
      privateCount: source.filter((event) => event.visibility === "private").length,
    };
  }, [data]);

  const nextUpcomingEvent = useMemo(() => {
    const source = data || [];
    const now = Date.now();

    const upcoming = source
      .filter((event) => new Date(event.start_date).getTime() >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return upcoming[0] || null;
  }, [data]);

  const hasActiveFilters = Boolean(search.trim()) || typeFilter !== "all" || sortBy !== "-start_date";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSortBy("-start_date");
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50/65 via-background to-amber-50/35 pb-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/35 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <section className="relative overflow-hidden rounded-[32px] border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/85 to-indigo-50/80 p-6 shadow-[0_24px_65px_-46px_rgba(37,99,235,0.55)] sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Event Directory
              </Badge>

              <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                Discover events faster with a cleaner, brighter experience
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Browse upcoming sessions, filter by format, and quickly find the events that fit your schedule.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {typeOptions.slice(1).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTypeFilter(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      typeFilter === option.value
                        ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {user?.is_staff && (
                  <Button onClick={() => navigate("/events/create")} className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Create event
                  </Button>
                )}
                <Button variant="outline" onClick={clearFilters} className="rounded-full border-slate-300 bg-white px-5 hover:bg-slate-100">
                  <X className="h-4 w-4" /> Reset filters
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100/90 bg-white/95 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Overview</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-sky-700">All events</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700">Upcoming</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.upcoming}</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-violet-700">Joined</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.joined}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700">Private</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.privateCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Next event</p>
                {nextUpcomingEvent ? (
                  <>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-900">{nextUpcomingEvent.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {format(new Date(nextUpcomingEvent.start_date), "EEE, MMM d · h:mm a")}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">No upcoming events scheduled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full border border-primary/20" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full border border-sky-200/70" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-border/70 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm sm:p-5 lg:sticky lg:top-24">
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Filter className="h-4 w-4 text-primary" /> Refine events
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Title, organizer, building..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-slate-200 bg-white pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={typeFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTypeFilter(option.value)}
                      className={cn(
                        "justify-start",
                        option.value === "all" && "col-span-2",
                        typeFilter === option.value && "bg-primary text-primary-foreground"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Sort events" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                  <p className="text-xs font-medium text-amber-900">Filters are active</p>
                  <p className="mt-1 text-xs text-amber-800">Showing focused results based on your criteria.</p>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 h-8 px-2 text-amber-900 hover:bg-amber-100">
                    <X className="h-3.5 w-3.5" /> Clear all
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900">
                  Apply filters to quickly discover relevant events.
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/50 to-amber-50/50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <LayoutGrid className="h-3.5 w-3.5" /> Event collection
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {isLoading ? "Loading events..." : `${events.length} result${events.length === 1 ? "" : "s"}`}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-800">
                  <Compass className="h-3.5 w-3.5" /> Discover
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-800">
                  <CalendarRange className="h-3.5 w-3.5" /> Curated
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
                  <Users className="h-3.5 w-3.5" /> Community
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                  <Lock className="h-3.5 w-3.5" /> Secure
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-fade-in [animation-fill-mode:both]" style={{ animationDelay: `${index * 45}ms` }}>
                    <EventCardSkeleton />
                  </div>
                ))}

              {!isLoading && events.length === 0 && (
                <div className="md:col-span-2 2xl:col-span-3 rounded-2xl border border-dashed border-border bg-white/90 px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-900">No matching events</p>
                  <p className="mt-1 text-sm text-slate-500">Try removing one or more filters to see more results.</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Reset filters <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-fade-in [animation-fill-mode:both]"
                  style={{ animationDelay: `${Math.min(index * 45, 240)}ms` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EventsPage;
