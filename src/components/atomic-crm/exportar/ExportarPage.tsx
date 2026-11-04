import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AmaiPage } from "../amai/AmaiPage";
import { descargar, mesActual, rangoDelMes, toCsv } from "./csv";
import { filasDelReporte, REPORTES, type Reporte } from "./reportes";

// "Exportar a Excel": pick a month and download its sales, payments or
// expenses as a CSV file for the accountant (Excel opens it directly).
export const ExportarPage = () => {
  const translate = useTranslate();
  const [mes, setMes] = useState(mesActual);

  return (
    <AmaiPage title={translate("amai.export.title")}>
      <p className="text-muted-foreground">{translate("amai.export.intro")}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="export-month">{translate("amai.export.month")}</Label>
        <Input
          id="export-month"
          type="month"
          value={mes}
          max={mesActual()}
          onChange={(event) => setMes(event.target.value)}
          className="h-11"
        />
      </div>
      <div className="flex flex-col gap-3">
        {REPORTES.map((reporte) => (
          <BotonReporte key={reporte} reporte={reporte} mes={mes} />
        ))}
      </div>
    </AmaiPage>
  );
};

const BotonReporte = ({ reporte, mes }: { reporte: Reporte; mes: string }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const [isLoading, setIsLoading] = useState(false);

  const exportar = async () => {
    setIsLoading(true);
    try {
      const filas = await filasDelReporte(
        reporte,
        rangoDelMes(mes),
        dataProvider,
        translate,
      );
      if (!filas.length) {
        notify("amai.export.empty", { type: "info" });
        return;
      }
      descargar(`${reporte}-${mes}.csv`, toCsv(filas));
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 justify-start gap-3 text-base"
      disabled={!mes || isLoading}
      onClick={exportar}
    >
      <Download className="size-5" />
      {translate(`amai.export.reports.${reporte}`)}
    </Button>
  );
};
