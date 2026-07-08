import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CityPage from "./pages/CityPage";
import AdDetail from "./pages/AdDetail";
import AdminPanel from "./pages/AdminPanel";
import Shop from "./pages/Shop";
import MyAds from "./pages/MyAds";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { useEffect } from "react";

const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function withBase(path: string): string {
  if (!ROUTER_BASE || path.startsWith(ROUTER_BASE + "/")) return path;
  return ROUTER_BASE + (path.startsWith("/") ? path : "/" + path);
}

function SpaRedirect() {
  const [_, navigate] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get("path");
    if (path) {
      navigate(withBase(path));
    }
  }, [navigate]);
  return null;
}

function Router() {
  return (
    <>
      <SpaRedirect />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/incontri/:city"} component={CityPage} />
        <Route path={"/ad"} component={AdDetail} />
        <Route path={"/ad/:slug"} component={AdDetail} />
        <Route path={"/shop"} component={Shop} />
        <Route path={"/my-ads"} component={MyAds} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/messages"} component={Messages} />
        <Route path={"/messages/:id"} component={Messages} />
        <Route path={"/admin"} component={AdminPanel} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/blog/:slug"} component={BlogPost} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
