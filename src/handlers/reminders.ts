import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { booking } from "../reservations.js";

// Reminder delivery is intentionally a callback-safe message renderer. The
// Worker alarm adapter owns wall-clock delivery; every reminder carries the
// same self-service controls as a confirmation.
const composer = new Composer<Ctx>();
composer.callbackQuery(/^booking:reminder:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const item = booking(ctx, ctx.match[1]);
  if (!item || item.guestId !== ctx.from?.id || item.status !== "confirmed") {
    await ctx.editMessageText("That booking is no longer active.");
    return;
  }
  await ctx.editMessageText(`Reminder: your table for ${item.party_size} is at ${item.booking_time} on ${item.booking_date}.`, {
    reply_markup: inlineKeyboard([[inlineButton("Reschedule", `booking:reschedule:${item.id}`), inlineButton("Cancel", `booking:cancel:${item.id}`)]]),
  });
});
export default composer;
