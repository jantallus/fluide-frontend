// lib/types.ts — Interfaces TypeScript partagées dans tout le projet

// ── Utilisateurs ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  role: 'admin' | 'monitor' | 'permanent' | 'user';
  status?: string;
  is_active_monitor?: boolean;
  phone?: string;
  color?: string;
  google_calendar_id?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  role: 'admin' | 'monitor' | 'permanent' | 'user';
}

// ── Planning ──────────────────────────────────────────────────────────────────

export interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  monitor_id: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  booking_options?: string | null;
  client_message?: string | null;
  flight_type_id?: number | null;
  weight?: number | null;
  payment_status?: string | null;
  resourceId?: string;
}

export interface CalendarAppointment {
  id: number;
  title: string;
  start: string;
  end: string;
  resourceId: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, unknown>;
}

export interface Monitor {
  id: string;
  title: string;
}

export interface SlotDefinition {
  id: number;
  monitor_id: string;
  start_time: string;
  end_time: string;
  plan_name?: string;
}

export interface OpeningPeriod {
  start: string;
  end: string;
  season?: string;
}

// ── Vols & prestations ────────────────────────────────────────────────────────

export interface FlightType {
  id: number;
  name: string;
  description?: string;
  duration_minutes?: number;
  price_cents: number;
  season?: string;
  is_active?: boolean;
  popup_content?: string;
  show_popup?: boolean;
  image_url?: string;
}

export interface Complement {
  id: number;
  name: string;
  description?: string;
  price_cents: number;
  is_active?: boolean;
  flight_type_ids?: number[];
}

// ── Bons cadeaux & codes promo ────────────────────────────────────────────────

export interface GiftCard {
  id: number;
  code: string;
  type: 'gift_card' | 'promo';
  buyer_name?: string;
  beneficiary_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
  flight_type_id?: number | null;
  flight_name?: string;
  gift_value?: number | null;
  discount_type?: 'fixed' | 'percent';
  discount_value?: number;
  discount_scope?: 'flight' | 'options' | 'both';
  max_uses?: number;
  used_count?: number;
  is_unlimited?: boolean;
  is_used?: boolean;
  is_partner?: boolean;
  partner_amount_cents?: number | null;
  partner_billing_type?: string;
  created_at?: string;
  expires_at?: string | null;
  custom_line_1?: string;
  custom_line_2?: string;
  custom_line_3?: string;
  pdf_background_url?: string;
  included_options?: number[];
}

export interface GiftCardTemplate {
  id: number;
  name: string;
  flight_type_id?: number | null;
  custom_line_1?: string;
  custom_line_2?: string;
  custom_line_3?: string;
  pdf_background_url?: string;
  popup_content?: string;
  show_popup?: boolean;
}

// ── Clients ───────────────────────────────────────────────────────────────────

export interface ClientFlight {
  id: number;
  start_time: string;
  payment_status?: string;
  monitor_name?: string;
  monitor_id?: string;
  flight_name?: string;
  price_cents?: number;
}

export interface Client {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  has_upcoming?: boolean | number;
  flights?: ClientFlight[];
}

// ── Statistiques ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  todaySlots: number;
  bookedSlots: number;
  revenue: number;
}

export interface UpcomingFlight {
  id: number;
  start_time: string;
  title?: string;
  flight_name?: string;
  monitor_name?: string;
  notes?: string;
}

export interface StatsSummary {
  totalRevenue: number;
  totalBookings: number;
}

// ── Réservation publique ──────────────────────────────────────────────────────

export interface PublicSlot {
  id: number;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked';
  monitor_id: string;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  weight: string;
}

export interface CartItem {
  slotId: number;
  startTime: string;
  endTime: string;
  flightTypeId: number;
  flightName: string;
  price: number;
  passenger: Passenger;
  selectedOptions: number[];
}

// ── Paramètres ────────────────────────────────────────────────────────────────

export interface Setting {
  key: string;
  value: string;
}

export type SettingsMap = Record<string, string>;

// ── API générique ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}