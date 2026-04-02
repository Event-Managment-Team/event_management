import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Role, Event } from "@/types";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

const getApiErrorMessage = (data: unknown) => {
  if (!data) return "Failed to save event";
  if (typeof data === "string") return data;
  if (typeof data !== "object") return "Failed to save event";

  const values = Object.values(data as Record<string, unknown>).flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (value == null) return [];
    return [String(value)];
  });

  return values.length > 0 ? values.join(", ") : "Failed to save event";
};

const CreateEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "offline" as Event["type"],
    visibility: "public" as Event["visibility"],
    building: "",
    floor: "",
    room: "",
    organizer: "",
    start_date: "",
    end_date: "",
    max_participants: 50,
    allowed_roles_ids: [] as number[],
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await authService.getRoles();
      return (res.data.results || res.data) as Role[];
    },
  });

  // Load existing event for edit
  useQuery({
    queryKey: ["event-edit", id],
    queryFn: async () => {
      const res = await eventService.getById(Number(id));
      const e = res.data as Event;
      setForm({
        title: e.title,
        description: e.description,
        type: e.type,
        visibility: e.visibility,
        building: e.building || "",
        floor: e.floor || "",
        room: e.room || "",
        organizer: e.organizer,
        start_date: e.start_date?.slice(0, 16) || "",
        end_date: e.end_date?.slice(0, 16) || "",
        max_participants: e.max_participants,
        allowed_roles_ids: e.allowed_roles?.map((r) => r.id) || [],
      });
      return e;
    },
    enabled: isEdit,
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      isEdit ? eventService.update(Number(id), data) : eventService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Event updated" : "Event created");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
    onError: (err: AxiosError<ApiError>) => {
      const status = err.response?.status;
      if (status === 403) {
        toast.error("Only staff/admin users can create or edit events");
        return;
      }

      toast.error(getApiErrorMessage(err.response?.data));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventService.delete(Number(id)),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const toggleRole = (roleId: number) => {
    setForm((f) => ({
      ...f,
      allowed_roles_ids: f.allowed_roles_ids.includes(roleId)
        ? f.allowed_roles_ids.filter((r) => r !== roleId)
        : [...f.allowed_roles_ids, roleId],
    }));
  };

  return (
    <div className="container py-8 max-w-2xl animate-fade-in">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate("/events")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Event" : "Create Event"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={update("title")} placeholder="Event title" required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={update("description")} placeholder="Describe the event" rows={4} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Event["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm((f) => ({ ...f, visibility: v as Event["visibility"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.type === "offline" || form.type === "hybrid") && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Building</Label>
                  <Input value={form.building} onChange={update("building")} placeholder="Building" />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input value={form.floor} onChange={update("floor")} placeholder="Floor" />
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Input value={form.room} onChange={update("room")} placeholder="Room" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input value={form.organizer} onChange={update("organizer")} placeholder="Organizer name" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="datetime-local" value={form.start_date} onChange={update("start_date")} required />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="datetime-local" value={form.end_date} onChange={update("end_date")} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max participants</Label>
              <Input type="number" min={1} value={form.max_participants} onChange={(e) => setForm((f) => ({ ...f, max_participants: parseInt(e.target.value) || 1 }))} />
            </div>

            {roles && roles.length > 0 && (
              <div className="space-y-2">
                <Label>Allowed roles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.allowed_roles_ids.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Save changes" : "Create event"}
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEventPage;
