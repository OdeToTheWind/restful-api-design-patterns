/**
 * 100% line coverage of happyHourDiscount needs just two tests (one inside the hour, one
 * outside). They would also pass for the buggy versions below — coverage shows which lines
 * RAN, not whether the behaviour is right. Boundary tests are what pin the rule down.
 */
import { happyHourDiscount } from '../checkout/checkout.service';

const at = (time: string) => new Date(`2026-10-08T${time}Z`);

// Plausible bugs that the two "coverage" tests can't tell apart from the real rule
const offByOneEnd = (subtotal: number, date: Date) =>
  date.getUTCHours() >= 17 && date.getUTCHours() <= 18 ? Math.round(subtotal * 0.1) : 0;
const truncating = (subtotal: number, date: Date) => (date.getUTCHours() === 17 ? Math.floor(subtotal * 0.1) : 0);

describe('two tests = 100% line coverage…', () => {
  const coverageOnly = (fn: typeof happyHourDiscount) =>
    fn(1000, at('17:30:00')) === 100 && fn(1000, at('10:00:00')) === 0;

  it('…and they pass for the correct rule AND for both buggy versions', () => {
    expect([happyHourDiscount, offByOneEnd, truncating].map(coverageOnly)).toEqual([true, true, true]);
  });
});

describe('boundary tests catch what coverage misses', () => {
  it.each([
    ['16:59:59', 0],
    ['17:00:00', 100],
    ['17:59:59', 100],
    ['18:00:00', 0], // offByOneEnd fails here
  ])('at %s the discount on $10.00 is %i cents', (time, expected) => {
    expect(happyHourDiscount(1000, at(time))).toBe(expected);
    if (time === '18:00:00') expect(offByOneEnd(1000, at(time))).not.toBe(expected);
  });

  it('rounds half a cent to the nearest cent', () => {
    expect(happyHourDiscount(1005, at('17:15:00'))).toBe(101); // truncating gives 100
    expect(truncating(1005, at('17:15:00'))).toBe(100);
  });
});
