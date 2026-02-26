import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ProductDetail from "@/pages/ProductDetail";
import SearchResults from "@/pages/SearchResults";
import Corporate from "./pages/Corporate";
import Career from "./pages/Career";
import Policies from "./pages/Policies";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/kurumsal"} component={Corporate} />
      <Route path={"/kariyer"} component={Career} />
      <Route path={"/politikalar"} component={Policies} />
      <Route path={"/product/:slug"} component={ProductDetail} />
      <Route path={"/search"} component={SearchResults} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <I18nProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
