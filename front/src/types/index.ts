export interface User {
  id?: number;
  username: string;
  email?: string;
  phone?: string;
  is_staff: boolean;
  is_superuser?: boolean;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  roles: Role[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  type: "online" | "offline" | "hybrid";
  visibility: "public" | "private";
  building?: string;
  floor?: string;
  room?: string;
  organizer: string;
  allowed_roles: Role[];
  allowed_roles_ids?: number[];
  start_date: string;
  end_date: string;
  max_participants: number;
  participant_count: number;
  is_joined?: boolean;
  images?: EventImage[];
  agenda?: AgendaItem[];
}

export interface EventImage {
  id: number;
  image: string;
  event: number;
}

export interface AgendaItem {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export interface GroupStatistic {
  group_name: string;
  count: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
