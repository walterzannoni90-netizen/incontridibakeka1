import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdDetail from "./pages/AdDetail";
import AdminPanel from "./pages/AdminPanel";
import Shop from "./pages/Shop";
import MyAds from "./pages/MyAds";

// Supporta deploy su GitHub Pages (sottopercorso) e custom domain (root).
// import.meta.env.BASE_URL e gestito da Vite: "/" su custom domain,
// "/nome-repo/" su GitHub Pages.
const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/ad"} component={AdDetail} />
      <Route path={"/ad/:slug"} component={AdDetail} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/my-ads"} component={MyAds} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
