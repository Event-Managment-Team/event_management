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
  desc: string; // Serializer-də 'desc' olduğu üçün düzəldildi
  type: "online" | "offline" | "hybrid";
  visibility: "public" | "private";
  building?: string;
  floor?: string;
  room?: string;
  organizer_side: string; // Model-də 'organizer_side' olduğu üçün düzəldildi
  allowed_roles: Role[];
  allowed_roles_ids?: number[];
  start_date: string;
  end_date: string;
  max_participants: number;
  participant_count: number;
  is_joined: boolean; // Artıq Backend-dən gəlir, mütləqdir
  images?: EventImage[];
  agenda?: AgendaItem[];
  created_date?: string;
}

export interface EventImage {
  id: number;
  image: string;
  event: number;
}

export interface AgendaItem {
  id: number;
  time_slot: string; // Serializer-də 'time_slot' adlanır
  action: string;    // Serializer-də 'action' adlanır
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