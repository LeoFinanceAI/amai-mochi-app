import { useCallback, useEffect, useState } from "react";

// An installed PWA keeps running the version it started with: a new one is
// downloaded in the background and only used after reopening the app twice.
// With registerType "prompt" (vite.config.ts) the new service worker waits
// instead; this hook says when one is waiting, and `actualizar` lets it take
// over and reloads once, at a moment the user picks (never mid-order).

const CHECK_EVERY_MS = 60 * 60 * 1000; // the app can stay open all day

export interface ServiceWorkerApi {
  ready: Promise<ServiceWorkerRegistration>;
  controller: ServiceWorker | null;
  addEventListener: (
    type: "controllerchange",
    listener: () => void,
    options?: { once: boolean },
  ) => void;
}

const browserServiceWorker = (): ServiceWorkerApi | null =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator
    ? navigator.serviceWorker
    : null;

export const useActualizacionDisponible = (
  serviceWorker: ServiceWorkerApi | null = browserServiceWorker(),
  recargar: () => void = () => window.location.reload(),
) => {
  const [enEspera, setEnEspera] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!serviceWorker) return;
    let cancelado = false;
    let intervalo: ReturnType<typeof setInterval> | undefined;

    serviceWorker.ready.then((registro) => {
      if (cancelado) return;
      // Only an update: on the very first install there is no controller yet.
      const revisar = () => {
        if (registro.waiting && serviceWorker.controller) {
          setEnEspera(registro.waiting);
        }
      };
      revisar();
      registro.addEventListener("updatefound", () => {
        const nuevo = registro.installing;
        nuevo?.addEventListener("statechange", () => {
          if (nuevo.state === "installed") revisar();
        });
      });
      intervalo = setInterval(() => {
        registro.update().catch(() => undefined); // offline: try next time
      }, CHECK_EVERY_MS);
    });

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [serviceWorker]);

  const actualizar = useCallback(() => {
    if (!enEspera || !serviceWorker) return;
    serviceWorker.addEventListener("controllerchange", recargar, {
      once: true,
    });
    // Handled by the Workbox-generated service worker (skipWaiting).
    enEspera.postMessage({ type: "SKIP_WAITING" });
  }, [enEspera, serviceWorker, recargar]);

  return { hayActualizacion: enEspera != null, actualizar };
};
