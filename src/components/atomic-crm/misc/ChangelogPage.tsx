import { useLocaleState, useTranslate } from "ra-core";

import { AmaiPage } from "../amai/AmaiPage";
import { NOVEDADES } from "../amai/novedades";
import { fromIsoDate } from "../pedidos/fechaEntrega";

// "Novedades": Amai Mochi's own release notes for Eduardo (amai/novedades.ts),
// instead of Atomic CRM's CHANGELOG.md, which is about screens he never sees.
export const ChangelogPage = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const formato = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AmaiPage title={translate("crm.changelog.title")}>
      {NOVEDADES.map((novedad) => (
        <section
          key={novedad.fecha}
          aria-label={formato.format(fromIsoDate(novedad.fecha))}
          className="rounded-xl border bg-card p-4"
        >
          <h2 className="text-xl">
            {formato.format(fromIsoDate(novedad.fecha))}
          </h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            {novedad.cambios.map((cambio) => (
              <li key={cambio}>{cambio}</li>
            ))}
          </ul>
        </section>
      ))}
    </AmaiPage>
  );
};

ChangelogPage.path = "/changelog";
