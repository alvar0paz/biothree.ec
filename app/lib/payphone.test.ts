import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  attemptFromClientTransactionId,
  buildClientTransactionId,
  confirmButtonPayment,
  ERROR_CODE_DUPLICATE_CLIENT_TX,
  isApproved,
  nextClientTransactionId,
  orderIdFromClientTransactionId,
  prepareButtonPayment,
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

describe('payment attempts', () => {
  it('reads the attempt number back from an id', () => {
    expect(attemptFromClientTransactionId('6123456789012')).toBe(1);
    expect(attemptFromClientTransactionId('6123456789012-3')).toBe(3);
    expect(attemptFromClientTransactionId('ID-UNICO-001')).toBe(0);
  });

  it('mints the next id from the last one stored on the order', () => {
    expect(nextClientTransactionId('6123456789012', null)).toBe('6123456789012');
    expect(nextClientTransactionId('6123456789012', '6123456789012')).toBe('6123456789012-2');
    expect(nextClientTransactionId('6123456789012', '6123456789012-2')).toBe('6123456789012-3');
    // An id from another order (or garbage) is not trusted as "previous".
    expect(nextClientTransactionId('6123456789012', '7000000000001-4')).toBe('6123456789012');
    expect(() => nextClientTransactionId('6123456789012', '6123456789012-9')).toThrow(/too long/);
  });
});

describe('button API', () => {
  const env = {PAYPHONE_API_TOKEN: 'pp_test', PAYPHONE_STORE_ID: 'store_1'};
  const amounts = {amount: 6485, amountWithTax: 5790, amountWithoutTax: 0, tax: 695};

  function stubFetch(status: number, body: string) {
    const fetchMock = vi.fn(async () => new Response(body, {status}));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  afterEach(() => vi.unstubAllGlobals());

  it('prepares a payment with the return URLs and resolves to the hosted URLs', async () => {
    const fetchMock = stubFetch(
      200,
      JSON.stringify({
        paymentId: 'GCjd4uI8',
        payWithPayPhone: 'https://pay.payphonetodoesposible.com/PayPhone/Index?paymentId=GCjd4uI8',
        payWithCard: 'https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=GCjd4uI8',
      }),
    );
    const result = await prepareButtonPayment(env, {
      clientTransactionId: '6123456789012',
      amounts,
      reference: 'Biothree #1002',
      responseUrl: 'https://biothree.ec/pago/payphone/respuesta',
      cancellationUrl: 'https://biothree.ec/pago/payphone/cancelado?pedido=6123456789012',
      email: 'cliente@example.com',
      phoneNumber: '+593991234567',
      documentId: null,
    });
    expect(result.payWithCard).toContain('Anonymous/Index');
    expect(result.paymentId).toBe('GCjd4uI8');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://pay.payphonetodoesposible.com/api/button/Prepare');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer pp_test');
    const body = JSON.parse(String(init.body)) as Record<string, number>;
    expect(body).toMatchObject({
      ...amounts,
      service: 0,
      tip: 0,
      clientTransactionId: '6123456789012',
      storeId: 'store_1',
      currency: 'USD',
      reference: 'Biothree #1002',
      responseUrl: 'https://biothree.ec/pago/payphone/respuesta',
      cancellationUrl: 'https://biothree.ec/pago/payphone/cancelado?pedido=6123456789012',
      email: 'cliente@example.com',
      phoneNumber: '+593991234567',
      lang: 'es',
    });
    expect(body).not.toHaveProperty('documentId');
    expect(body.amount).toBe(body.amountWithTax + body.amountWithoutTax + body.tax + body.service + body.tip);
  });

  it('carries PayPhone\'s error code so callers can react to duplicates', async () => {
    stubFetch(400, '{"message":"Ya existe una transacción con el ClientTransactionId especificado","errorCode":23}');
    await expect(
      prepareButtonPayment(env, {
        clientTransactionId: '6123456789012',
        amounts,
        reference: 'x',
        responseUrl: 'https://biothree.ec/r',
        cancellationUrl: 'https://biothree.ec/c',
      }),
    ).rejects.toMatchObject({name: 'PayphoneError', code: ERROR_CODE_DUPLICATE_CLIENT_TX});
  });

  it('rejects a prepare answer without a card URL', async () => {
    stubFetch(200, '{"paymentId":"x"}');
    await expect(
      prepareButtonPayment(env, {
        clientTransactionId: '1',
        amounts,
        reference: 'x',
        responseUrl: 'https://biothree.ec/r',
        cancellationUrl: 'https://biothree.ec/c',
      }),
    ).rejects.toThrow(/no payment URL/);
  });

  it('confirms with PayPhone\'s field names and parses the sale', async () => {
    const fetchMock = stubFetch(
      200,
      JSON.stringify({
        transactionId: 23178284,
        clientTransactionId: '6123456789012',
        statusCode: 3,
        transactionStatus: 'Approved',
        amount: 6485,
        authorizationCode: 'W23178284',
        messageCode: 0,
        message: null,
      }),
    );
    const sale = await confirmButtonPayment(env, {transactionId: '23178284', clientTransactionId: '6123456789012'});
    expect(sale).toMatchObject({transactionId: 23178284, statusCode: 3, authorizationCode: 'W23178284'});
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://pay.payphonetodoesposible.com/api/button/V2/Confirm');
    expect(JSON.parse(String(init.body))).toEqual({id: 23178284, clientTxId: '6123456789012'});
  });

  it('maps "transaction does not exist" and bad ids to null', async () => {
    stubFetch(404, '{"message":"La transacción no existe","errorCode":20}');
    expect(await confirmButtonPayment(env, {transactionId: 1, clientTransactionId: 'x'})).toBeNull();
    stubFetch(400, '{"message":"La transacción no existe","errorCode":20}');
    expect(await confirmButtonPayment(env, {transactionId: 1, clientTransactionId: 'x'})).toBeNull();
    const fetchMock = stubFetch(200, '{}');
    expect(await confirmButtonPayment(env, {transactionId: 'abc', clientTransactionId: 'x'})).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on other confirm failures so the page can retry', async () => {
    stubFetch(500, 'oops');
    await expect(confirmButtonPayment(env, {transactionId: 1, clientTransactionId: 'x'})).rejects.toThrow(
      /Confirm API 500/,
    );
  });
});
