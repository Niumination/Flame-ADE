import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/jetbrains-mono/cyrillic-400.css";
import "@fontsource/jetbrains-mono/cyrillic-700.css";
import "@xterm/xterm/css/xterm.css";
import "./styles/globals.css";
import "./App.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initLaunchDir } from "./lib/launchDir";
import { IS_MAC } from "./lib/platform";

if (!IS_MAC) {
  document.documentElement.dataset.chrome = "borderless";
}

await initLaunchDir();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);

const showWindow = () => {
  getCurrentWindow()
    .show()
    .catch((e) => console.error("window.show failed:", e));
};
setTimeout(showWindow, 50);
setTimeout(showWindow, 500);
