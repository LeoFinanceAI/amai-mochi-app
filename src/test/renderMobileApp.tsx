import { memoryStore } from "ra-core";
import { MemoryRouter } from "react-router";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { i18nProvider } from "@/components/atomic-crm/providers/commons/i18nProvider";
import { createDataProvider } from "@/components/atomic-crm/providers/fakerest";
import type { Db } from "@/components/atomic-crm/providers/fakerest/dataGenerator/types";
import { CRM } from "@/components/atomic-crm/root/CRM";

import { createCrmDb, createTestAuthProvider } from "./StoryWrapper";

type DataProvider = ReturnType<typeof createDataProvider>;

// Lets a test swap one data provider method, e.g. to simulate a server error.
export type DataProviderOverride = (base: DataProvider) => DataProvider;

const VIEWPORTS = {
  phone: [375, 667],
  desktop: [1280, 800],
} as const;

// The whole app in Spanish, as Eduardo sees it, backed by an in-memory
// FakeRest database. Phone-sized by default (the app is mobile first).
export const renderMobileApp = async ({
  path = "/",
  data = {},
  dataProvider,
  device = "phone",
}: {
  path?: string;
  data?: Partial<Db>;
  dataProvider?: DataProviderOverride;
  device?: keyof typeof VIEWPORTS;
} = {}) => {
  localStorage.clear();
  const [width, height] = VIEWPORTS[device];
  await page.viewport(width, height);
  await i18nProvider.changeLocale("es");
  const base = createDataProvider({ db: createCrmDb(data), silent: true });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CRM
        authProvider={createTestAuthProvider()}
        dataProvider={dataProvider ? dataProvider(base) : base}
        i18nProvider={i18nProvider}
        store={memoryStore()}
        disableTelemetry
      />
    </MemoryRouter>,
  );
};
