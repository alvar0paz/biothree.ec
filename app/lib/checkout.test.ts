import {describe, expect, it} from 'vitest';
import {
  CLEAR_CART_COOKIE,
  EC_PROVINCES,
  formatAddress,
  isValidCedula,
  isValidDocumentId,
  isValidRuc,
  normalizeEcuadorPhone,
  parseCheckoutForm,
  provinceName,
} from './checkout';

const validForm = {
  email: ' Cliente@Example.com ',
  phone: '099 123 4567',
  firstName: 'Ana',
  lastName: 'Pérez',
  documentId: '1710034065',
  address1: 'Av. Amazonas N24-03',
  address2: 'Depto 4',
  city: 'Quito',
  provinceCode: 'P',
  zip: '170135',
};

function asFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe('normalizeEcuadorPhone', () => {
  it('turns local mobiles and landlines into E.164', () => {
    expect(normalizeEcuadorPhone('0991234567')).toBe('+593991234567');
    expect(normalizeEcuadorPhone('099-123-4567')).toBe('+593991234567');
    expect(normalizeEcuadorPhone('(02) 2345678')).toBe('+59322345678');
    expect(normalizeEcuadorPhone('+593 99 123 4567')).toBe('+593991234567');
    expect(normalizeEcuadorPhone('593991234567')).toBe('+593991234567');
  });

  it('rejects anything that is not an Ecuadorian number', () => {
    expect(normalizeEcuadorPhone('991234567')).toBeNull(); // missing leading 0
    expect(normalizeEcuadorPhone('0891234567')).toBeNull(); // 08 is not a mobile prefix
    expect(normalizeEcuadorPhone('+1 555 123 4567')).toBeNull();
    expect(normalizeEcuadorPhone('abc')).toBeNull();
    expect(normalizeEcuadorPhone('')).toBeNull();
  });
});

describe('cédula / RUC', () => {
  it('validates cédulas with the mod-10 check digit', () => {
    expect(isValidCedula('1710034065')).toBe(true);
    expect(isValidCedula('1710034066')).toBe(false); // wrong check digit
    expect(isValidCedula('2510034065')).toBe(false); // province 25 doesn't exist
    expect(isValidCedula('1760034065')).toBe(false); // third digit ≥ 6 is not a person
    expect(isValidCedula('171003406')).toBe(false);
  });

  it('validates the three RUC kinds', () => {
    expect(isValidRuc('1710034065001')).toBe(true); // natural person
    expect(isValidRuc('1790016919001')).toBe(true); // private company (mod 11)
    expect(isValidRuc('1760001550001')).toBe(true); // public body (mod 11)
    expect(isValidRuc('1710034065000')).toBe(false); // establishment 000
    expect(isValidRuc('1790016918001')).toBe(false);
    expect(isValidRuc('1780016919001')).toBe(false); // third digit 8 is unassigned
  });

  it('accepts either as a document id', () => {
    expect(isValidDocumentId('1710034065')).toBe(true);
    expect(isValidDocumentId('1790016919001')).toBe(true);
    expect(isValidDocumentId('123')).toBe(false);
  });
});

describe('parseCheckoutForm', () => {
  it('normalises a valid form', () => {
    const parsed = parseCheckoutForm(asFormData(validForm));
    expect(parsed.ok).toBe(true);
    expect(parsed.errors).toEqual({});
    expect(parsed.values.email).toBe('Cliente@Example.com');
    expect(parsed.normalized).toEqual({
      email: 'cliente@example.com',
      phone: '+593991234567',
      documentId: '1710034065',
      address: {
        firstName: 'Ana',
        lastName: 'Pérez',
        address1: 'Av. Amazonas N24-03',
        address2: 'Depto 4',
        city: 'Quito',
        provinceCode: 'P',
        province: 'Pichincha',
        zip: '170135',
        phone: '+593991234567',
      },
    });
  });

  it('treats the document id and address2/zip as optional', () => {
    const parsed = parseCheckoutForm({...validForm, documentId: '', address2: '', zip: ''});
    expect(parsed.ok).toBe(true);
    expect(parsed.normalized?.documentId).toBeNull();
    expect(parsed.normalized?.address.address2).toBeNull();
    expect(parsed.normalized?.address.zip).toBeNull();
  });

  it('reports every missing or malformed field in Spanish', () => {
    const parsed = parseCheckoutForm({
      email: 'not-an-email',
      phone: '12',
      documentId: '999',
      provinceCode: 'ZZ',
    });
    expect(parsed.ok).toBe(false);
    expect(parsed.normalized).toBeNull();
    expect(Object.keys(parsed.errors).sort()).toEqual(
      ['address1', 'city', 'documentId', 'email', 'firstName', 'lastName', 'phone', 'provinceCode'].sort(),
    );
    expect(parsed.errors.email).toMatch(/correo/);
    expect(parsed.errors.provinceCode).toMatch(/provincia/);
    expect(parsed.errors.phone).toMatch(/celular/);
  });

  it('accepts plain objects as well as FormData', () => {
    expect(parseCheckoutForm(validForm).ok).toBe(true);
  });
});

describe('provinces', () => {
  it('lists the 24 provinces with ISO codes', () => {
    expect(EC_PROVINCES).toHaveLength(24);
    expect(new Set(EC_PROVINCES.map((province) => province.code)).size).toBe(24);
    expect(provinceName('P')).toBe('Pichincha');
    expect(provinceName('SD')).toBe('Santo Domingo de los Tsáchilas');
    expect(provinceName('XX')).toBeNull();
  });

  it('formats an address on one line with the province name', () => {
    expect(
      formatAddress({
        firstName: 'Ana',
        lastName: 'Pérez',
        address1: 'Av. Amazonas N24-03',
        address2: null,
        city: 'Quito',
        provinceCode: 'P',
        zip: '170135',
        phone: '+593991234567',
      }),
    ).toBe('Av. Amazonas N24-03, Quito, Pichincha, 170135');
  });
});

describe('CLEAR_CART_COOKIE', () => {
  it('expires the cookie Hydrogen sets on /', () => {
    expect(CLEAR_CART_COOKIE).toMatch(/^cart=;/);
    expect(CLEAR_CART_COOKIE).toContain('Path=/');
    expect(CLEAR_CART_COOKIE).toContain('Max-Age=0');
  });
});
