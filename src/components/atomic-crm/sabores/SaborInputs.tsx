import { maxLength, required, useInput, useTranslate } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { TextInput } from "@/components/admin/text-input";
import { cn } from "@/lib/utils";

// Flavor colors from the brand guide, offered as one-tap swatches.
const FLAVOR_SWATCHES = [
  "#EE8FA8",
  "#F3C443",
  "#A985D1",
  "#8A5A3C",
  "#6E6E6E",
  "#E3CC8A",
  "#E58F35",
  "#8A9A3E",
];

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// Mirrors the CHECK constraint on sabor.color, so the error shows before saving.
const validateColor = (value: unknown) =>
  typeof value === "string" && HEX_COLOR.test(value)
    ? undefined
    : "amai.flavors.invalid_color";

export const SaborInputs = ({
  showActivo = false,
}: {
  showActivo?: boolean;
}) => (
  <div className="flex flex-col gap-4">
    <TextInput
      source="nombre"
      validate={[required(), maxLength(40)]}
      autoComplete="off"
    />
    <ColorInput />
    {showActivo ? <BooleanInput source="activo" /> : null}
  </div>
);

const ColorInput = () => {
  const translate = useTranslate();
  const { id, field, fieldState } = useInput({
    source: "color",
    defaultValue: FLAVOR_SWATCHES[0],
    validate: validateColor,
  });
  const value = typeof field.value === "string" ? field.value : "";
  const error = fieldState.error?.message;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium mb-2">
        {translate("resources.sabor.fields.color")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {FLAVOR_SWATCHES.map((swatch) => {
          const isSelected = value.toUpperCase() === swatch;
          return (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              aria-pressed={isSelected}
              onClick={() => field.onChange(swatch)}
              className={cn(
                "size-11 rounded-full border-2 border-transparent",
                isSelected && "border-foreground",
              )}
              style={{ background: swatch }}
            />
          );
        })}
        <input
          id={id}
          type="color"
          aria-label={translate("resources.sabor.fields.color")}
          value={HEX_COLOR.test(value) ? value : FLAVOR_SWATCHES[0]}
          onChange={(event) => field.onChange(event.target.value.toUpperCase())}
          onBlur={field.onBlur}
          className="size-11 rounded-full cursor-pointer bg-transparent"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {translate("amai.flavors.color_hint")}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {translate(error)}
        </p>
      ) : null}
    </fieldset>
  );
};
