import { I18nContextProvider } from "ra-core";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { i18nProvider } from "@/components/atomic-crm/providers/commons/i18nProvider";

import { AvisoActualizacion } from "./AvisoActualizacion";
import type { ServiceWorkerApi } from "./useActualizacionDisponible";

// A browser service worker container, with an optional new version waiting.
const fakeServiceWorker = ({
  waiting,
  controlled = true,
}: {
  waiting: boolean;
  controlled?: boolean;
}) => {
  const mensajes: unknown[] = [];
  const listeners: Array<() => void> = [];
  const enEspera = {
    postMessage: (mensaje: unknown) => {
      mensajes.push(mensaje);
      // The real worker activates and takes control after SKIP_WAITING.
      listeners.forEach((listener) => listener());
    },
  } as unknown as ServiceWorker;
  const registro = {
    waiting: waiting ? enEspera : null,
    installing: null,
    addEventListener: () => undefined,
    update: () => Promise.resolve(),
  } as unknown as ServiceWorkerRegistration;
  const api: ServiceWorkerApi = {
    ready: Promise.resolve(registro),
    controller: controlled ? ({} as ServiceWorker) : null,
    addEventListener: (_type, listener) => listeners.push(listener),
  };
  return { api, mensajes };
};

const renderAviso = async (api: ServiceWorkerApi, recargar = () => {}) => {
  await i18nProvider.changeLocale("es");
  return render(
    <I18nContextProvider value={i18nProvider}>
      <AvisoActualizacion isMobile serviceWorker={api} recargar={recargar} />
    </I18nContextProvider>,
  );
};

describe("new version notice", () => {
  it("offers to update when a new version is waiting, and reloads once", async () => {
    // Arrange
    const { api, mensajes } = fakeServiceWorker({ waiting: true });
    let recargas = 0;
    const screen = await renderAviso(api, () => recargas++);

    // Act
    await screen.getByRole("button", { name: "Actualizar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Hay una versión nueva de la app"))
      .toBeInTheDocument();
    expect(mensajes).toEqual([{ type: "SKIP_WAITING" }]);
    expect(recargas).toBe(1);
  });

  it("can be left for later without reloading", async () => {
    // Arrange
    const { api, mensajes } = fakeServiceWorker({ waiting: true });
    let recargas = 0;
    const screen = await renderAviso(api, () => recargas++);

    // Act
    await screen.getByRole("button", { name: "Después" }).click();

    // Assert
    await expect
      .element(screen.getByText("Hay una versión nueva de la app"))
      .not.toBeInTheDocument();
    expect(mensajes).toEqual([]);
    expect(recargas).toBe(0);
  });

  it("stays hidden when there is no new version, or on the first install", async () => {
    // Act
    const sinNueva = await renderAviso(
      fakeServiceWorker({ waiting: false }).api,
    );
    const primeraVez = await renderAviso(
      fakeServiceWorker({ waiting: true, controlled: false }).api,
    );

    // Assert
    for (const screen of [sinNueva, primeraVez]) {
      await expect
        .element(screen.getByText("Hay una versión nueva de la app"))
        .not.toBeInTheDocument();
    }
  });
});
