import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { isOwner, markNoShow, upcoming } from "../reservations.js";
const composer = new Composer<Ctx>();
function rows(ctx: Ctx) { return upcoming(ctx).flatMap((b) => [[inlineButton(`${b.booking_date} ${b.booking_time} · ${b.party_size}`, `admin:booking:${b.id}`)]]); }
composer.callbackQuery("admin:bookings", async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) { await ctx.editMessageText("This area is for the restaurant owner."); return; } const list = upcoming(ctx); if (!list.length) { await ctx.editMessageText("No upcoming bookings yet — tables are ready to reserve.", { reply_markup: inlineKeyboard([[inlineButton("Back to admin", "admin:menu")]]) }); return; } await ctx.editMessageText("Here are your upcoming bookings.", { reply_markup: inlineKeyboard([...rows(ctx), [inlineButton("Back to admin", "admin:menu")]]) }); });
composer.callbackQuery(/^admin:booking:(\d+)$/, async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) return; const item = upcoming(ctx).find((b) => b.id === ctx.match[1]); if (!item) { await ctx.editMessageText("That booking is no longer active."); return; } await ctx.editMessageText(`${item.guest_name} has a table for ${item.party_size} at ${item.booking_time} on ${item.booking_date}.`, { reply_markup: inlineKeyboard([[inlineButton("Mark no-show", `admin:noshow:${item.id}`)], [inlineButton("Back to bookings", "admin:bookings")]]) }); });
composer.callbackQuery(/^admin:noshow:(\d+)$/, async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) return; if (!markNoShow(ctx, ctx.match[1])) { await ctx.editMessageText("That booking can’t be marked as a no-show."); return; } await ctx.editMessageText("Marked as a no-show. That table is now available.", { reply_markup: inlineKeyboard([[inlineButton("Back to bookings", "admin:bookings")]]) }); });
export default composer;
