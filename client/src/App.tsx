import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect } from "react";

const Home = lazy(() => import("./pages/Home"));
const CityPage = lazy(() => import("./pages/CityPage"));
const AdDetail = lazy(() => import("./pages/AdDetail"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Shop = lazy(() => import("./pages/Shop"));
const MyAds = lazy(() => import("./pages/MyAds"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

function HomePage() {
  return <Home />;
}

function Router() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen grid place-items-center text-sm text-muted-foreground" aria-live="polite">
          Caricamento…
        </div>
      )}
    >
      <SpaRedirect />
      <Switch>
        <Route path={"/"} component={HomePage} />
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
    </Suspense>
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
