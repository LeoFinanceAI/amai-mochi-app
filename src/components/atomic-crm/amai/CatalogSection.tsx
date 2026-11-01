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

// Entry to the Amai Mochi catalog from the mobile Settings page.
export const CatalogSection = () => {
  const translate = useTranslate();
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
        {translate("amai.catalog.title")}
      </p>
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
  );
};

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
