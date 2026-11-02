import { ChevronRight } from "lucide-react";
import { useTranslate } from "ra-core";
import { Link } from "react-router";

import { AMAI_PATHS } from "./paths";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";

// The public privacy notice for Eduardo's clients (LFPDPPP).
const PRIVACY_NOTICE_URL = "/privacidad/";

// Entry to the Amai Mochi catalog, expenses and privacy notice from the mobile
// Settings page.
export const CatalogSection = () => {
  const translate = useTranslate();
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>{translate("amai.catalog.title")}</SectionTitle>
        <ItemGroup className="rounded-lg border overflow-hidden">
          <CatalogItem
            to="/sabor"
            label={translate("resources.sabor.name", { smart_count: 2 })}
          />
          <CatalogItem
            to={AMAI_PATHS.prices}
            label={translate("amai.prices.title")}
          />
          <CatalogItem
            to="/cliente"
            label={translate("resources.cliente.name", { smart_count: 2 })}
          />
        </ItemGroup>
      </div>
      <div>
        <SectionTitle>{translate("amai.money.title")}</SectionTitle>
        <ItemGroup className="rounded-lg border overflow-hidden">
          <CatalogItem
            to={AMAI_PATHS.expenses}
            label={translate("amai.expenses.title")}
          />
        </ItemGroup>
      </div>
      <div>
        <SectionTitle>{translate("amai.legal.title")}</SectionTitle>
        <ItemGroup className="rounded-lg border overflow-hidden">
          {/* A static page outside the app (public/privacidad), so a plain link. */}
          <Item
            size="sm"
            className="cursor-pointer min-h-11"
            render={<a href={PRIVACY_NOTICE_URL} />}
          >
            <ItemContent>
              <ItemTitle className="font-normal">
                {translate("amai.legal.privacy_notice")}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRight className="size-4 text-muted-foreground" />
            </ItemActions>
          </Item>
        </ItemGroup>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children: string }) => (
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
    {children}
  </p>
);

const CatalogItem = ({ to, label }: { to: string; label: string }) => (
  <Item size="sm" className="cursor-pointer min-h-11" render={<Link to={to} />}>
    <ItemContent>
      <ItemTitle className="font-normal">{label}</ItemTitle>
    </ItemContent>
    <ItemActions>
      <ChevronRight className="size-4 text-muted-foreground" />
    </ItemActions>
  </Item>
);
