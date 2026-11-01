import { Link } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";

// The "amai mochi" wordmark, centered in the phone top bar as in the approved
// mockups. It links home, like the logo in the desktop header.
export const AmaiWordmark = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  return (
    <Link to="/" className="mx-auto flex items-center min-h-11">
      <img
        className="[.light_&]:hidden h-9 w-auto"
        src={darkModeLogo}
        alt={title}
      />
      <img
        className="[.dark_&]:hidden h-9 w-auto"
        src={lightModeLogo}
        alt={title}
      />
    </Link>
  );
};
