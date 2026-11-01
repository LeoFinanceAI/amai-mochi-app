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

// Entry to the Amai Mochi catalog from the mobile Settings page; clients and
// prices join this list in stage 1.
export const CatalogSection = () => {
  const translate = useTranslate();
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
        {translate("amai.catalog.title")}
      </p>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <Item
          size="sm"
          className="cursor-pointer min-h-11"
          render={<Link to="/sabor" />}
        >
          <ItemContent>
            <ItemTitle className="font-normal">
              {translate("resources.sabor.name", { smart_count: 2 })}
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRight className="size-4 text-muted-foreground" />
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  );
};
