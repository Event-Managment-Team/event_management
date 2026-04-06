import api from "./api";
import type { Event } from "@/types";

// Backend-dən gələn fərqli adlandırılmış sahələri idarə etmək üçün tip
type BackendEvent = Omit<Event, "description" | "organizer" | "agenda"> & {
  desc?: string;
  organizer_side?: string;
  agendas?: Array<{ time_slot?: string; action?: string }>;
};

// Backend-dən gələn datayı Frontend formatına çevirən köməkçi funksiya
const toFrontendEvent = (event: BackendEvent): Event => ({
  ...(event as Event),
  description: event.description ?? event.desc ?? "",
  organizer: event.organizer ?? event.organizer_side ?? "",
  agenda:
    event.agenda ??
    event.agendas?.map((item, index) => ({
      id: index,
      title: item.action ?? "",
      description: "",
      start_time: item.time_slot ?? "",
      end_time: item.time_slot ?? "",
    })),
});

// Frontend-dən gedən datayı Backend-in gözlədiyi formata çevirən funksiya
const toBackendPayload = (data: Partial<Event>) => {
  const payload: Record<string, unknown> = { ...data };

  if ("description" in payload) {
    payload.desc = payload.description;
    delete payload.description;
  }

  if ("organizer" in payload) {
    payload.organizer_side = payload.organizer;
    delete payload.organizer;
  }

  if ("agenda" in payload) {
    delete payload.agenda;
  }

  if (payload.floor === "") {
    payload.floor = null;
  } else if (typeof payload.floor === "string") {
    const parsed = Number(payload.floor);
    payload.floor = Number.isNaN(parsed) ? null : parsed;
  }

  return payload;
};

export const eventService = {
  // Bütün tədbirləri gətirir
  getAll: async (params?: { search?: string; type?: string; ordering?: string; page?: number }) => {
    const res = await api.get("/events/", { params });
    if (Array.isArray(res.data?.results)) {
      return {
        ...res,
        data: {
          ...res.data,
          results: res.data.results.map((event: BackendEvent) => toFrontendEvent(event)),
        },
      };
    }

    if (Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map((event: BackendEvent) => toFrontendEvent(event)),
      };
    }

    return res;
  },

  // ID-yə görə tək tədbiri gətirir
  getById: async (id: number) => {
    const res = await api.get(`/events/${id}/`);
    return {
      ...res,
      data: toFrontendEvent(res.data as BackendEvent),
    };
  },

  create: async (data: Partial<Event>) => {
    const res = await api.post("/events/", toBackendPayload(data));
    return {
      ...res,
      data: toFrontendEvent(res.data as BackendEvent),
    };
  },

  update: async (id: number, data: Partial<Event>) => {
    const res = await api.patch(`/events/${id}/`, toBackendPayload(data));
    return {
      ...res,
      data: toFrontendEvent(res.data as BackendEvent),
    };
  },

  delete: (id: number) =>
    api.delete(`/events/${id}/`),

  getGroupStatistics: (id: number) =>
    api.get(`/events/${id}/group_statistics/`),

  // Tədbirə qoşulmaq üçün
  joinEvent: (data: { event: number; group_name?: string; email?: string }) =>
    api.post("/allowed-participants/", data),

  // --- YENİ: Tədbirdən çıxmaq funksiyası ---
  unjoinEvent: (eventId: number) =>
    api.post("/allowed-participants/unjoin/", { event: eventId }),

  uploadImage: (eventId: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("event", String(eventId));
    return api.post("/event-images/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};