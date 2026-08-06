import { describe, expect, it } from 'vitest';
import { formatMoney, sanitizeDecimalInput } from './money';

describe('sanitizeDecimalInput', () => {
  it('keeps one decimal point', () => {
    expect(sanitizeDecimalInput('10.50')).toBe('10.50');
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
  });

  it('removes non-numeric characters and normalizes comma decimals', () => {
    expect(sanitizeDecimalInput('$ 1,99')).toBe('1.99');
    expect(sanitizeDecimalInput('abc0.75')).toBe('0.75');
  });
});

describe('formatMoney', () => {
  it('keeps integer money formatting and displays decimal amounts', () => {
    expect(formatMoney(1000)).toBe('$1.000');
    expect(formatMoney(10.5)).toBe('$10,50');
    expect(formatMoney(1.99)).toBe('$1,99');
  });
});
