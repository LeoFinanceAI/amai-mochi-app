import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChartColumn, CreditCard, Plus, Settings } from "lucide-react";
import { useTranslate } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { AMAI_PATHS } from "../amai/ComingSoonPage";

// Bottom bar of the approved Amai Mochi mockups: Nuevo pedido / Por cobrar /
// Resumen, plus Settings, which is where the admin creates the other users.
const NAVIGATION_ITEMS = [
  {
    href: AMAI_PATHS.newOrder,
    Icon: Plus,
    labelKey: "amai.navigation.new_order",
  },
  {
    href: AMAI_PATHS.receivables,
    Icon: CreditCard,
    labelKey: "amai.navigation.receivables",
  },
  {
    href: AMAI_PATHS.summary,
    Icon: ChartColumn,
    labelKey: "amai.navigation.summary",
  },
  { href: "/settings", Icon: Settings, labelKey: "amai.navigation.settings" },
] as const;

export const MobileNavigation = () => {
  const location = useLocation();
  const translate = useTranslate();

  // Check if the app is running as a PWA (standalone mode)
  const isPwa = window.matchMedia("(display-mode: standalone)").matches;
  // Check if it's iOS on the web
  const isWebiOS = /iPad|iPod|iPhone/.test(window.navigator.userAgent);

  return (
    <nav
      aria-label={translate("amai.navigation.label")}
      className="fixed bottom-0 left-0 right-0 z-50 bg-secondary h-14"
      style={{
        // iOS bug: even though viewport is set correctly, the bottom safe area inset is not accounted for
        // So we manually add some padding to avoid the navigation being too close to the home bar
        paddingBottom: isPwa && isWebiOS ? 15 : undefined,
        // We use box-sizing: border-box, so the height contains the padding.
        // To actually increase the padding, we need to increase the height as well
        height:
          "calc(var(--spacing)) * 6" + (isPwa && isWebiOS ? " + 15px" : ""),
      }}
    >
      <div className="flex justify-center">
        {NAVIGATION_ITEMS.map(({ href, Icon, labelKey }) => (
          <NavigationButton
            key={href}
            href={href}
            Icon={Icon}
            label={translate(labelKey)}
            isActive={!!matchPath(`${href}/*`, location.pathname)}
          />
        ))}
      </div>
    </nav>
  );
};

const NavigationButton = ({
  href,
  Icon,
  label,
  isActive,
}: {
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  isActive: boolean;
}) => (
  <Link
    to={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({ variant: "ghost" }),
      // min-h-11 keeps every target at least 44px tall (CLAUDE.md).
      "flex-1 flex-col gap-1 h-auto min-h-11 py-2 px-1 rounded-md",
      isActive ? "text-primary" : "text-muted-foreground",
    )}
  >
    <Icon className="size-6" />
    <span className="text-xs font-semibold">{label}</span>
  </Link>
);
