import { maxLength, required, useInput, useTranslate } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { TextInput } from "@/components/admin/text-input";
import { cn } from "@/lib/utils";

const TIPOS = ["distribuidor", "publico", "evento"] as const;

// Mirrors the CHECK constraint on cliente.telefono: digits only, 10 to 13.
const PHONE_DIGITS = /^[0-9]{10,13}$/;

// "33 1234-5678" or "+52 33..." is stored as plain digits, ready for wa.me.
const phoneToDigits = (value: unknown) =>
  typeof value === "string" ? value.replace(/\D/g, "") || null : null;

const validatePhone = (value: unknown) =>
  value == null || value === "" || PHONE_DIGITS.test(String(value))
    ? undefined
    : "amai.clients.invalid_phone";

export const ClienteInputs = ({
  showActivo = false,
}: {
  showActivo?: boolean;
}) => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <TextInput
        source="nombre"
        validate={[required(), maxLength(80)]}
        autoComplete="off"
      />
      <TipoInput />
      <TextInput
        source="zona"
        validate={maxLength(60)}
        placeholder={translate("amai.clients.zona_placeholder")}
      />
      <TextInput
        source="telefono"
        type="tel"
        inputMode="tel"
        parse={phoneToDigits}
        validate={validatePhone}
        helperText="amai.clients.phone_hint"
      />
      <TextInput source="notas" multiline rows={3} />
      {showActivo ? <BooleanInput source="activo" /> : null}
    </div>
  );
};

// The client type as three large chips (44px targets), still native radios
// for screen readers.
const TipoInput = () => {
  const translate = useTranslate();
  const { id, field } = useInput({ source: "tipo" });
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium mb-2">
        {translate("resources.cliente.fields.tipo")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {TIPOS.map((tipo) => {
          const optionId = `${id}-${tipo}`;
          const isChecked = field.value === tipo;
          return (
            <label
              key={tipo}
              htmlFor={optionId}
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-semibold",
                isChecked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={field.name}
                value={tipo}
                checked={isChecked}
                onChange={() => field.onChange(tipo)}
                onBlur={field.onBlur}
                className="absolute inset-0 m-0 cursor-pointer opacity-0"
              />
              {translate(`resources.cliente.tipos.${tipo}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
