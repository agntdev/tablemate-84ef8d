import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { capacity, dateFor, isOwner } from "../reservations.js";
const composer = new Composer<Ctx>();
composer.callbackQuery("admin:capacity", async (ctx) => { await ctx.answerCallbackQuery(); if (!isOwner(ctx)) { await ctx.editMessageText("This area is for the restaurant owner."); return; } const c = capacity(ctx, dateFor("today")); await ctx.editMessageText(`Today has ${c.remaining} seats remaining. ${c.booked} of ${c.seats} seats are booked.`, { reply_markup: inlineKeyboard([[inlineButton("Back to admin", "admin:menu")]]) }); });
export default composer;
