import type { Ctx } from "./bot.js";
import { now } from "./clock.js";

export type BookingStatus = "confirmed" | "cancelled" | "no-show";
export interface TableType { table_type: string; number_of_tables: number; seats_per_table: number; total_seats: number }
export interface Sitting { weekday: number; opening_hour: string; closing_hour: string; sitting_duration: number }
export interface Booking {
  id: string; guestId: number; guest_name: string; party_size: number; booking_date: string;
  booking_time: string; table_allocation: string; reference_code: string; status: BookingStatus; reminder_sent?: boolean;
}
export interface RestaurantData {
  ownerId?: number; tableTypes: TableType[]; sittings: Sitting[]; reminderHours: number; bookings: Booking[]; nextBooking: number;
}

const defaults = (): RestaurantData => ({
  tableTypes: [
    { table_type: "Two-person", number_of_tables: 4, seats_per_table: 2, total_seats: 8 },
    { table_type: "Four-person", number_of_tables: 4, seats_per_table: 4, total_seats: 16 },
    { table_type: "Six-person", number_of_tables: 2, seats_per_table: 6, total_seats: 12 },
  ],
  sittings: Array.from({ length: 7 }, (_, weekday) => ({
    weekday, opening_hour: "11:00", closing_hour: weekday === 0 || weekday === 6 ? "23:00" : "22:00", sitting_duration: 90,
  })), reminderHours: 24, bookings: [], nextBooking: 1,
});

function data(ctx: Ctx): RestaurantData {
  return (ctx.session.restaurant ??= defaults());
}
function iso(date: Date): string { return date.toISOString().slice(0, 10); }
export function dateFor(day: "today" | "tomorrow"): string {
  const value = new Date(now().getTime());
  if (day === "tomorrow") value.setUTCDate(value.getUTCDate() + 1);
  return iso(value);
}
export function readableDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}
function minutes(value: string): number { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
function hhmm(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
export function slots(ctx: Ctx, date: string, party: number): string[] {
  const d = new Date(`${date}T12:00:00Z`); const sitting = data(ctx).sittings.find((s) => s.weekday === d.getUTCDay());
  if (!sitting || party > totalSeats(ctx)) return [];
  const available: string[] = [];
  for (let t = minutes(sitting.opening_hour); t + sitting.sitting_duration <= minutes(sitting.closing_hour); t += sitting.sitting_duration) {
    const time = hhmm(t); if (allocation(ctx, date, time, party)) available.push(time);
  }
  return available;
}
export function totalSeats(ctx: Ctx): number { return data(ctx).tableTypes.reduce((sum, t) => sum + t.total_seats, 0); }
function allocation(ctx: Ctx, date: string, time: string, party: number): TableType | undefined {
  const used = data(ctx).bookings.filter((b) => b.status === "confirmed" && b.booking_date === date && b.booking_time === time).map((b) => b.table_allocation);
  return data(ctx).tableTypes.filter((t) => t.seats_per_table >= party).sort((a, b) => a.seats_per_table - b.seats_per_table).find((t) => used.filter((u) => u === t.table_type).length < t.number_of_tables);
}
export function createBooking(ctx: Ctx, input: Required<NonNullable<Ctx["session"]["booking"]>>): Booking | undefined {
  const table = allocation(ctx, input.date, input.time, input.partySize); if (!table) return undefined;
  const store = data(ctx); const serial = store.nextBooking++;
  const booking: Booking = { id: String(serial), guestId: ctx.from?.id ?? 0, guest_name: input.guestName || "Guest", party_size: input.partySize, booking_date: input.date, booking_time: input.time, table_allocation: table.table_type, reference_code: `TR${String(serial).padStart(4, "0")}`, status: "confirmed" };
  store.bookings.push(booking); return booking;
}
export function booking(ctx: Ctx, id: string): Booking | undefined { return data(ctx).bookings.find((b) => b.id === id); }
export function guestBookings(ctx: Ctx): Booking[] { const uid = ctx.from?.id; return data(ctx).bookings.filter((b) => b.guestId === uid && b.status === "confirmed"); }
export function upcoming(ctx: Ctx): Booking[] { const today = dateFor("today"); return data(ctx).bookings.filter((b) => b.status === "confirmed" && b.booking_date >= today).sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`)); }
export function cancel(ctx: Ctx, id: string): boolean { const b = booking(ctx, id); if (!b || b.status !== "confirmed") return false; b.status = "cancelled"; return true; }
export function markNoShow(ctx: Ctx, id: string): boolean { const b = booking(ctx, id); if (!b || b.status !== "confirmed") return false; b.status = "no-show"; return true; }
export function isOwner(ctx: Ctx): boolean { return data(ctx).ownerId === ctx.from?.id; }
export function claimOwner(ctx: Ctx): boolean { const store = data(ctx); if (store.ownerId && store.ownerId !== ctx.from?.id) return false; store.ownerId = ctx.from?.id; return true; }
export function configureTables(ctx: Ctx, tableTypes: TableType[]): void { data(ctx).tableTypes = tableTypes.filter((t) => t.number_of_tables > 0 && t.seats_per_table > 0).map((t) => ({ ...t, total_seats: t.number_of_tables * t.seats_per_table })); }
export function configureSitting(ctx: Ctx, weekday: number, opening: string, closing: string, duration: number): boolean { if (!/^\d\d:\d\d$/.test(opening) || !/^\d\d:\d\d$/.test(closing) || minutes(opening) >= minutes(closing) || duration < 15) return false; const item = data(ctx).sittings.find((s) => s.weekday === weekday); if (!item) return false; Object.assign(item, { opening_hour: opening, closing_hour: closing, sitting_duration: duration }); return true; }
export function setReminderHours(ctx: Ctx, hours: number): boolean { if (!Number.isInteger(hours) || hours < 1 || hours > 168) return false; data(ctx).reminderHours = hours; return true; }
export function reminderHours(ctx: Ctx): number { return data(ctx).reminderHours; }
export function capacity(ctx: Ctx, date: string): { seats: number; booked: number; remaining: number } { const booked = data(ctx).bookings.filter((b) => b.status === "confirmed" && b.booking_date === date).reduce((n, b) => n + b.party_size, 0); const seats = totalSeats(ctx); return { seats, booked, remaining: Math.max(0, seats - booked) }; }
