import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import MobileHeader from "../layout/MobileHeader";
import { MobileContent } from "../layout/MobileContent";
import { AmaiWordmark } from "./AmaiWordmark";

// Frame shared by the Amai Mochi screens. On phones, as in the mockups: the
// wordmark in the top bar and the screen title below it. On desktop the header
// already shows the logo; the screen is a narrow centered column (the screens
// are short; a table would be empty space).
export const AmaiPage = ({
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
          <AmaiWordmark />
        </MobileHeader>
        <MobileContent>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl text-primary">{title}</h1>
            {children}
          </div>
        </MobileContent>
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
