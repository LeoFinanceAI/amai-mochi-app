import { ChevronRight } from "lucide-react";
import { useTranslate } from "ra-core";
import { Link } from "react-router";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";

// Entry to the Amai Mochi catalog from the mobile Settings page; prices join
// this list later in stage 1.
export const CatalogSection = () => {
  const translate = useTranslate();
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
        {translate("amai.catalog.title")}
      </p>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <CatalogItem to="/sabor" resource="sabor" />
        <CatalogItem to="/cliente" resource="cliente" />
      </ItemGroup>
    </div>
  );
};

const CatalogItem = ({ to, resource }: { to: string; resource: string }) => {
  const translate = useTranslate();
  return (
    <Item
      size="sm"
      className="cursor-pointer min-h-11"
      render={<Link to={to} />}
    >
      <ItemContent>
        <ItemTitle className="font-normal">
          {translate(`resources.${resource}.name`, { smart_count: 2 })}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <ChevronRight className="size-4 text-muted-foreground" />
      </ItemActions>
    </Item>
  );
};
