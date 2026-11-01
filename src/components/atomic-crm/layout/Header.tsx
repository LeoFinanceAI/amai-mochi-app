import { FileText, Settings, User, Users } from "lucide-react";
import { CanAccess, useTranslate, useUserMenu } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { ChangelogPage } from "../misc/ChangelogPage";
import { AMAI_PATHS } from "../amai/paths";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();
  const translate = useTranslate();

  // Same screens as the mobile bottom bar, plus the catalogs.
  // activeOn: the paths that highlight the tab (default: the tab and below).
  const tabs: Array<{ to: string; label: string; activeOn?: string[] }> = [
    { to: AMAI_PATHS.newOrder, label: translate("amai.navigation.new_order") },
    {
      to: AMAI_PATHS.orders,
      label: translate("amai.navigation.orders"),
      activeOn: [
        AMAI_PATHS.orders,
        AMAI_PATHS.deliveriesToday,
        `${AMAI_PATHS.orders}/:id/edit`,
      ],
    },
    {
      to: AMAI_PATHS.receivables,
      label: translate("amai.navigation.receivables"),
    },
    { to: AMAI_PATHS.summary, label: translate("amai.navigation.summary") },
    {
      to: "/sabor",
      label: translate("resources.sabor.name", { smart_count: 2 }),
    },
    {
      to: "/cliente",
      label: translate("resources.cliente.name", { smart_count: 2 }),
    },
  ];

  return (
    <>
      <nav className="grow">
        <header className="bg-secondary">
          <div className="px-4">
            <div className="flex justify-between items-center flex-1">
              <Link
                to="/"
                className="flex items-center gap-2 text-secondary-foreground no-underline"
              >
                <img
                  className="[.light_&]:hidden h-10"
                  src={darkModeLogo}
                  alt={title}
                />
                <img
                  className="[.dark_&]:hidden h-10"
                  src={lightModeLogo}
                  alt={title}
                />
                <h1 className="sr-only">{title}</h1>
              </Link>
              <div>
                <nav className="flex">
                  {tabs.map((tab) => (
                    <NavigationTab
                      key={tab.to}
                      label={tab.label}
                      to={tab.to}
                      isActive={(tab.activeOn ?? [`${tab.to}/*`]).some(
                        (path) => !!matchPath(path, location.pathname),
                      )}
                    />
                  ))}
                </nav>
              </div>
              <div className="flex items-center">
                <ThemeModeToggle />
                <RefreshButton />
                <UserMenu>
                  <ProfileMenu />
                  <CanAccess resource="sales" action="list">
                    <UsersMenu />
                  </CanAccess>
                  <CanAccess resource="configuration" action="edit">
                    <SettingsMenu />
                  </CanAccess>
                  <ChangelogMenuItem />
                </UserMenu>
              </div>
            </div>
          </div>
        </header>
      </nav>
    </>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? "text-secondary-foreground border-secondary-foreground"
        : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
    }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<UsersMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem
      onClick={userMenuContext.onClose}
      render={<Link to="/sales" className="flex items-center gap-2" />}
    >
      <Users />
      {translate("resources.sales.name", { smart_count: 2 })}
    </DropdownMenuItem>
  );
};

const ProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ProfileMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem
      onClick={userMenuContext.onClose}
      render={<Link to="/profile" className="flex items-center gap-2" />}
    >
      <User />
      {translate("crm.profile.title")}
    </DropdownMenuItem>
  );
};

const SettingsMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<SettingsMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem
      onClick={userMenuContext.onClose}
      render={<Link to="/settings" className="flex items-center gap-2" />}
    >
      <Settings />
      {translate("crm.settings.title")}
    </DropdownMenuItem>
  );
};

const ChangelogMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ChangelogMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem
      onClick={userMenuContext.onClose}
      render={
        <Link to={ChangelogPage.path} className="flex items-center gap-2" />
      }
    >
      <FileText />
      {translate("crm.changelog.title")}
    </DropdownMenuItem>
  );
};
export default Header;
