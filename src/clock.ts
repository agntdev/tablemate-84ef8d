export type Clock = () => Date;
let clock: Clock = () => new Date();

/** The single clock seam for dates, slots, and reminder eligibility. */
export function now(): Date {
  return clock();
}

export function setClockForTests(next: Clock): void {
  clock = next;
}
