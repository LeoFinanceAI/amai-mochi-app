import { useTranslate } from "ra-core";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  useActualizacionDisponible,
  type ServiceWorkerApi,
} from "./useActualizacionDisponible";

interface AvisoActualizacionProps {
  // Phones: above the bottom bar. Desktop: bottom corner.
  isMobile?: boolean;
  // For tests: a fake service worker and reload.
  serviceWorker?: ServiceWorkerApi | null;
  recargar?: () => void;
}

// "There is a new version — Update": the user decides when the app reloads,
// so it never happens in the middle of taking an order. "Later" hides it until
// the app is opened again.
export const AvisoActualizacion = ({
  isMobile = false,
  serviceWorker,
  recargar,
}: AvisoActualizacionProps) => {
  const translate = useTranslate();
  const { hayActualizacion, actualizar } = useActualizacionDisponible(
    serviceWorker,
    recargar,
  );
  const [oculto, setOculto] = useState(false);

  if (!hayActualizacion || oculto) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed z-50 flex items-center gap-2 rounded-xl border bg-card p-3 shadow-lg",
        isMobile ? "inset-x-4 bottom-[4.5rem]" : "bottom-4 right-4 max-w-sm",
      )}
    >
      <RefreshCw className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="flex-1 text-sm font-semibold">
        {translate("amai.update.available")}
      </span>
      <Button
        variant="ghost"
        className="min-h-11"
        onClick={() => setOculto(true)}
      >
        {translate("amai.update.later")}
      </Button>
      <Button className="min-h-11" onClick={actualizar}>
        {translate("amai.update.now")}
      </Button>
    </div>
  );
};
