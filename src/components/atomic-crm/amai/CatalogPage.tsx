import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import MobileHeader from "../layout/MobileHeader";
import { MobileContent } from "../layout/MobileContent";

// Frame shared by the catalog screens: the mobile header on phones, a narrow
// centered column on desktop (catalogs are short, a table would be empty space).
export const CatalogPage = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <>
        <MobileHeader>
          <h1 className="text-3xl text-primary">{title}</h1>
        </MobileHeader>
        <MobileContent>{children}</MobileContent>
      </>
    );
  }
  return (
    <div className="max-w-lg w-full mx-auto mt-8 flex flex-col gap-4">
      <h1 className="text-4xl text-primary">{title}</h1>
      {children}
    </div>
  );
};
