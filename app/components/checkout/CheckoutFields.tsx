import {EC_PROVINCES, type CheckoutFormErrors, type CheckoutFormValues} from '~/lib/checkout';

type FieldName = keyof CheckoutFormValues;

function Field({
  name,
  label,
  values,
  errors,
  hint,
  type = 'text',
  autoComplete,
  inputMode,
  required = true,
  placeholder,
}: {
  name: FieldName;
  label: string;
  values: CheckoutFormValues;
  errors: CheckoutFormErrors;
  hint?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  required?: boolean;
  placeholder?: string;
}) {
  const id = `checkout-${name}`;
  const error = errors[name];
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="bt-note font-medium text-ink">
        {label}
        {!required && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={values[name]}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`bt-input ${error ? 'border-red-600' : ''}`}
      />
      {error ? (
        <p id={`${id}-error`} className="bt-note text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="bt-note text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Contact + shipping address fields of the checkout's first step. */
export function CheckoutFields({
  values,
  errors,
}: {
  values: CheckoutFormValues;
  errors: CheckoutFormErrors;
}) {
  const provinceError = errors.provinceCode;
  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="bt-h3 mb-4 text-ink">Contacto</legend>
        <Field
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          values={values}
          errors={errors}
          hint="Aquí te enviamos la confirmación del pedido."
        />
        <Field
          name="phone"
          label="Celular"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0991234567"
          values={values}
          errors={errors}
          hint="Para coordinar la entrega."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="bt-h3 mb-4 text-ink">Dirección de envío</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="firstName"
            label="Nombre"
            autoComplete="given-name"
            values={values}
            errors={errors}
          />
          <Field
            name="lastName"
            label="Apellido"
            autoComplete="family-name"
            values={values}
            errors={errors}
          />
        </div>
        <Field
          name="documentId"
          label="Cédula o RUC"
          inputMode="numeric"
          required={false}
          values={values}
          errors={errors}
          hint="Para emitir tu factura."
        />
        <Field
          name="address1"
          label="Dirección"
          autoComplete="address-line1"
          placeholder="Calle principal y número"
          values={values}
          errors={errors}
        />
        <Field
          name="address2"
          label="Referencia, edificio o departamento"
          autoComplete="address-line2"
          required={false}
          values={values}
          errors={errors}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="city"
            label="Ciudad"
            autoComplete="address-level2"
            values={values}
            errors={errors}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-provinceCode" className="bt-note font-medium text-ink">
              Provincia
            </label>
            <select
              id="checkout-provinceCode"
              name="provinceCode"
              defaultValue={values.provinceCode}
              required
              autoComplete="address-level1"
              aria-invalid={provinceError ? true : undefined}
              aria-describedby={provinceError ? 'checkout-provinceCode-error' : undefined}
              className={`bt-input ${provinceError ? 'border-red-600' : ''}`}
            >
              <option value="">Elige una provincia</option>
              {EC_PROVINCES.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            {provinceError && (
              <p id="checkout-provinceCode-error" className="bt-note text-red-700">
                {provinceError}
              </p>
            )}
          </div>
        </div>
        <Field
          name="zip"
          label="Código postal"
          autoComplete="postal-code"
          inputMode="numeric"
          required={false}
          values={values}
          errors={errors}
        />
      </fieldset>
    </div>
  );
}
