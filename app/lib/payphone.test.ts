import {describe, expect, it} from 'vitest';
import {
  buildClientTransactionId,
  isApproved,
  orderIdFromClientTransactionId,
  splitAmounts,
  toCents,
} from './payphone';

describe('toCents', () => {
  it('converts decimal strings without float drift', () => {
    expect(toCents('28.95')).toBe(2895);
    expect(toCents('32.95')).toBe(3295);
    expect(toCents('0.1')).toBe(10);
    expect(toCents(61.9)).toBe(6190);
  });

  it('rejects garbage', () => {
    expect(() => toCents('abc')).toThrow();
    expect(() => toCents('')).not.toThrow(); // Number('') is 0
  });
});

describe('splitAmounts', () => {
  it('puts everything in amountWithoutTax when there is no tax', () => {
    expect(splitAmounts({totalCents: 2895, taxCents: 0})).toEqual({
      amount: 2895,
      amountWithTax: 0,
      amountWithoutTax: 2895,
      tax: 0,
    });
  });

  it('derives the taxable base from the rate and keeps the sum exact', () => {
    // $28.95 with 15% IVA included: base 25.17, tax 3.78.
    const split = splitAmounts({totalCents: 2895, taxCents: 378, taxRate: 0.15});
    expect(split.amountWithTax + split.amountWithoutTax + split.tax).toBe(2895);
    expect(split.tax).toBe(378);
    // 378 / 0.15 = 2520, which exceeds the 2517 left after tax, so the base is
    // clamped and the non-taxable remainder is zero, never negative.
    expect(split.amountWithTax).toBe(2517);
    expect(split.amountWithoutTax).toBe(0);
  });

  it('never lets rounding push the base past the total', () => {
    const split = splitAmounts({totalCents: 100, taxCents: 15, taxRate: 0.15});
    expect(split.amountWithTax).toBe(85);
    expect(split.amountWithoutTax).toBe(0);
    expect(split.amount).toBe(100);
  });

  it('treats the whole net as taxable when no rate is known', () => {
    const split = splitAmounts({totalCents: 6190, taxCents: 807});
    expect(split).toEqual({amount: 6190, amountWithTax: 5383, amountWithoutTax: 0, tax: 807});
  });

  it('rejects non-positive totals', () => {
    expect(() => splitAmounts({totalCents: 0, taxCents: 0})).toThrow();
    expect(() => splitAmounts({totalCents: 12.5, taxCents: 0})).toThrow();
  });
});

describe('clientTransactionId', () => {
  it('round-trips a 13-digit Shopify order id', () => {
    const id = buildClientTransactionId('6123456789012');
    expect(id).toBe('6123456789012');
    expect(id.length).toBeLessThanOrEqual(15);
    expect(orderIdFromClientTransactionId(id)).toBe('6123456789012');
  });

  it('suffixes retries and still parses back to the order', () => {
    const id = buildClientTransactionId(6123456789012, 2);
    expect(id).toBe('6123456789012-2');
    expect(orderIdFromClientTransactionId(id)).toBe('6123456789012');
  });

  it('rejects ids that would exceed PayPhone\'s 15-char cap or aren\'t numeric', () => {
    expect(() => buildClientTransactionId('6123456789012', 100)).toThrow();
    expect(() => buildClientTransactionId('gid://shopify/Order/1')).toThrow();
    expect(orderIdFromClientTransactionId('ID-UNICO-001')).toBeNull();
  });
});

describe('isApproved', () => {
  it('accepts status code 3 or the Approved label', () => {
    expect(isApproved({statusCode: 3, transactionStatus: 'Approved'})).toBe(true);
    expect(isApproved({statusCode: 3, transactionStatus: 'Aprobada'})).toBe(true);
    expect(isApproved({statusCode: 1, transactionStatus: 'Pending'})).toBe(false);
    expect(isApproved({statusCode: 2, transactionStatus: 'Canceled'})).toBe(false);
  });
});
