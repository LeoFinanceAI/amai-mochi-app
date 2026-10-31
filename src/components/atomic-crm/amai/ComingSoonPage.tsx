import { useTranslate } from "ra-core";

import MobileHeader from "../layout/MobileHeader";
import { MobileContent } from "../layout/MobileContent";

// Paths of the Amai Mochi MVP screens linked from the mobile bottom bar.
// Each one shows a placeholder until its stage of the backlog ships.
export const AMAI_PATHS = {
  newOrder: "/orders/new",
  receivables: "/receivables",
  summary: "/summary",
} as const;

interface ComingSoonPageProps {
  titleKey: string;
  stage: number;
}

export const ComingSoonPage = ({ titleKey, stage }: ComingSoonPageProps) => {
  const translate = useTranslate();
  return (
    <>
      <MobileHeader>
        <h1 className="text-3xl text-primary">{translate(titleKey)}</h1>
      </MobileHeader>
      <MobileContent>
        <div className="rounded-xl border bg-card p-6 text-center">
          <h2 className="text-2xl">{translate("amai.coming_soon.title")}</h2>
          <p className="mt-2 text-muted-foreground">
            {translate("amai.coming_soon.body", { stage })}
          </p>
        </div>
      </MobileContent>
    </>
  );
};
