// Pure helpers for the storefront checkout form: Ecuador-specific validation
// (provinces, phone numbers, cédula/RUC) and the FormData → typed values
// step. No I/O, so everything here is unit-tested directly.

import type {CheckoutAddress} from '~/lib/shopify-checkout';

/**
 * Hydrogen keeps the cart id in a `cart` cookie on `/` (see
 * `cartSetIdDefault`). Expiring it is how the cart is emptied once its
 * items belong to an order.
 */
export const CLEAR_CART_COOKIE = 'cart=; Path=/; Max-Age=0; SameSite=Lax';

/** ISO 3166-2:EC codes, which is what Shopify expects in `provinceCode`. */
export const EC_PROVINCES: ReadonlyArray<{code: string; name: string}> = [
  {code: 'A', name: 'Azuay'},
  {code: 'B', name: 'Bolívar'},
  {code: 'F', name: 'Cañar'},
  {code: 'C', name: 'Carchi'},
  {code: 'H', name: 'Chimborazo'},
  {code: 'X', name: 'Cotopaxi'},
  {code: 'O', name: 'El Oro'},
  {code: 'E', name: 'Esmeraldas'},
  {code: 'W', name: 'Galápagos'},
  {code: 'G', name: 'Guayas'},
  {code: 'I', name: 'Imbabura'},
  {code: 'L', name: 'Loja'},
  {code: 'R', name: 'Los Ríos'},
  {code: 'M', name: 'Manabí'},
  {code: 'S', name: 'Morona Santiago'},
  {code: 'N', name: 'Napo'},
  {code: 'D', name: 'Orellana'},
  {code: 'Y', name: 'Pastaza'},
  {code: 'P', name: 'Pichincha'},
  {code: 'SE', name: 'Santa Elena'},
  {code: 'SD', name: 'Santo Domingo de los Tsáchilas'},
  {code: 'U', name: 'Sucumbíos'},
  {code: 'T', name: 'Tungurahua'},
  {code: 'Z', name: 'Zamora Chinchipe'},
];

export function provinceName(code: string): string | null {
  return EC_PROVINCES.find((province) => province.code === code)?.name ?? null;
}

/**
 * Ecuadorian phone → E.164. Mobiles are 09XXXXXXXX (10 digits), landlines
 * 0[2-7]XXXXXXX (9 digits); both may arrive with +593, spaces or dashes.
 * Null when it is neither.
 */
export function normalizeEcuadorPhone(raw: string): string | null {
  let digits = raw.replace(/[\s().-]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('593')) digits = `0${digits.slice(3)}`;
  if (digits.startsWith('00593')) digits = `0${digits.slice(5)}`;
  if (/^09\d{8}$/.test(digits)) return `+593${digits.slice(1)}`;
  if (/^0[2-7]\d{7}$/.test(digits)) return `+593${digits.slice(1)}`;
  return null;
}

/** Cédula: 10 digits, province 01-24 (30 for foreigners), mod-10 check digit. */
export function isValidCedula(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  if (Number(value[2]) >= 6) return false;
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = Number(value[i]) * coefficients[i];
    if (product >= 10) product -= 9;
    sum += product;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(value[9]);
}

function mod11Check(digits: string, coefficients: number[]): number | null {
  let sum = 0;
  for (let i = 0; i < coefficients.length; i++) {
    sum += Number(digits[i]) * coefficients[i];
  }
  const remainder = sum % 11;
  if (remainder === 0) return 0;
  const check = 11 - remainder;
  return check === 10 ? null : check;
}

/**
 * RUC: 13 digits. Natural persons are their cédula plus an establishment
 * number; private companies (third digit 9) and public bodies (third digit
 * 6) use mod-11 check digits.
 */
export function isValidRuc(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  const third = Number(value[2]);
  if (third < 6) {
    return isValidCedula(value.slice(0, 10)) && Number(value.slice(10)) >= 1;
  }
  if (third === 9) {
    const check = mod11Check(value, [4, 3, 2, 7, 6, 5, 4, 3, 2]);
    return check !== null && check === Number(value[9]) && Number(value.slice(10)) >= 1;
  }
  if (third === 6) {
    const check = mod11Check(value, [3, 2, 7, 6, 5, 4, 3, 2]);
    return check !== null && check === Number(value[8]) && Number(value.slice(9)) >= 1;
  }
  return false;
}

export function isValidDocumentId(value: string): boolean {
  return isValidCedula(value) || isValidRuc(value);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CheckoutFormValues = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  documentId: string;
  address1: string;
  address2: string;
  city: string;
  provinceCode: string;
  zip: string;
};

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export const EMPTY_CHECKOUT_VALUES: CheckoutFormValues = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  documentId: '',
  address1: '',
  address2: '',
  city: '',
  provinceCode: '',
  zip: '',
};

const FIELD_NAMES = Object.keys(EMPTY_CHECKOUT_VALUES) as Array<keyof CheckoutFormValues>;

function readField(source: FormData | Record<string, unknown>, name: string): string {
  const value = source instanceof FormData ? source.get(name) : source[name];
  return typeof value === 'string' ? value.trim() : '';
}

/** Trimmed values for every field, empty strings for the missing ones. */
export function readCheckoutValues(source: FormData | Record<string, unknown>): CheckoutFormValues {
  const values = {...EMPTY_CHECKOUT_VALUES};
  for (const name of FIELD_NAMES) values[name] = readField(source, name);
  return values;
}

export type ParsedCheckoutForm = {
  values: CheckoutFormValues;
  errors: CheckoutFormErrors;
  ok: boolean;
  /** Normalised inputs, only meaningful when `ok`. */
  normalized: {
    email: string;
    phone: string;
    documentId: string | null;
    address: CheckoutAddress;
  } | null;
};

/**
 * Validates the shipping/contact form. Errors are customer-facing Spanish
 * strings keyed by field; `values` echoes what was typed so the form can be
 * re-rendered as it was.
 */
export function parseCheckoutForm(source: FormData | Record<string, unknown>): ParsedCheckoutForm {
  const values = readCheckoutValues(source);
  const errors: CheckoutFormErrors = {};

  if (!values.email) errors.email = 'Ingresa tu correo electrónico.';
  else if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254) {
    errors.email = 'Ingresa un correo válido.';
  }

  const phone = values.phone ? normalizeEcuadorPhone(values.phone) : null;
  if (!values.phone) errors.phone = 'Ingresa tu número de celular.';
  else if (!phone) errors.phone = 'Ingresa un celular válido, por ejemplo 0991234567.';

  if (!values.firstName) errors.firstName = 'Ingresa tu nombre.';
  if (!values.lastName) errors.lastName = 'Ingresa tu apellido.';

  const documentId = values.documentId.replace(/[\s.-]/g, '');
  if (documentId && !isValidDocumentId(documentId)) {
    errors.documentId = 'Ingresa una cédula (10 dígitos) o RUC (13 dígitos) válido.';
  }

  if (!values.address1) errors.address1 = 'Ingresa tu dirección.';
  if (!values.city) errors.city = 'Ingresa tu ciudad.';
  if (!values.provinceCode) errors.provinceCode = 'Elige tu provincia.';
  else if (!provinceName(values.provinceCode)) errors.provinceCode = 'Elige una provincia válida.';
  if (values.zip && !/^[\dA-Za-z -]{3,10}$/.test(values.zip)) {
    errors.zip = 'Revisa el código postal.';
  }

  for (const name of FIELD_NAMES) {
    if (values[name].length > 255) errors[name] = 'Demasiado largo.';
  }

  const ok = Object.keys(errors).length === 0;
  return {
    values,
    errors,
    ok,
    normalized:
      ok && phone
        ? {
            email: values.email.toLowerCase(),
            phone,
            documentId: documentId || null,
            address: {
              firstName: values.firstName,
              lastName: values.lastName,
              address1: values.address1,
              address2: values.address2 || null,
              city: values.city,
              provinceCode: values.provinceCode,
              province: provinceName(values.provinceCode),
              zip: values.zip || null,
              phone,
            },
          }
        : null,
  };
}

/** One-line address for the review step and confirmation pages. */
export function formatAddress(address: CheckoutAddress): string {
  const parts = [
    address.address1,
    address.address2,
    address.city,
    address.province ?? provinceName(address.provinceCode) ?? address.provinceCode,
    address.zip,
  ].filter((part): part is string => Boolean(part));
  return parts.join(', ');
}
