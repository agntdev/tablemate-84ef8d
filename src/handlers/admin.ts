import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { claimOwner, configureSitting, configureTables, isOwner, setReminderHours } from "../reservations.js";

import { registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Owner tools", data: "admin:menu", order: 90 });
const composer = new Composer<Ctx>();
const menu = () => inlineKeyboard([[inlineButton("Upcoming bookings", "admin:bookings"), inlineButton("Today’s capacity", "admin:capacity")], [inlineButton("Table settings", "admin:tables"), inlineButton("Hours and reminders", "admin:hours")], [inlineButton("Back", "menu:main")]]);
async function show(ctx: Ctx, edit = false) { const text = "Manage today’s reservations and restaurant settings."; if (edit) await ctx.editMessageText(text, { reply_markup: menu() }); else await ctx.reply(text, { reply_markup: menu() }); }
composer.command("admin", async (ctx) => { if (!claimOwner(ctx)) { await ctx.reply("This area is for the restaurant owner."); return; } await show(ctx); });
composer.callbackQuery("admin:menu", async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) { await ctx.editMessageText("This area is for the restaurant owner."); return; } await show(ctx, true); });
composer.callbackQuery("admin:tables", async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) { await ctx.editMessageText("This area is for the restaurant owner."); return; } await ctx.editMessageText("Choose a table setup. This replaces the current table counts.", { reply_markup: inlineKeyboard([[inlineButton("4 tables · 2 seats", "admin:tables:small"), inlineButton("6 tables · 4 seats", "admin:tables:medium")], [inlineButton("Back", "admin:menu")]]) }); });
composer.callbackQuery(/^admin:tables:(small|medium)$/, async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) return; configureTables(ctx, ctx.match[1] === "small" ? [{ table_type: "Two-person", number_of_tables: 4, seats_per_table: 2, total_seats: 8 }] : [{ table_type: "Four-person", number_of_tables: 6, seats_per_table: 4, total_seats: 24 }]); await ctx.editMessageText("Your table setup is saved.", { reply_markup: inlineKeyboard([[inlineButton("Back to admin", "admin:menu")]]) }); });
composer.callbackQuery("admin:hours", async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) { await ctx.editMessageText("This area is for the restaurant owner."); return; } await ctx.editMessageText("Choose a reminder timing. Opening hours use the restaurant’s daily schedule.", { reply_markup: inlineKeyboard([[inlineButton("24 hours before", "admin:reminder:24"), inlineButton("2 hours before", "admin:reminder:2")], [inlineButton("Back", "admin:menu")]]) }); });
composer.callbackQuery(/^admin:reminder:(2|24)$/, async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) return; const hours = Number(ctx.match[1]); setReminderHours(ctx, hours); for (let day = 0; day < 7; day++) configureSitting(ctx, day, "11:00", day === 0 || day === 6 ? "23:00" : "22:00", 90); await ctx.editMessageText(`Reminders will go out ${hours} hours before a booking.`, { reply_markup: inlineKeyboard([[inlineButton("Back to admin", "admin:menu")]]) }); });
export default composer;
