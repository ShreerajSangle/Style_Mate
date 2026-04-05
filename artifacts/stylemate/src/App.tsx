import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { Shirt, Wand2 } from "lucide-react";
import { Home } from "@/pages/Home";
import { WardrobePage } from "@/pages/Wardrobe";
import { WeatherWidget } from "@/components/WeatherWidget";

function Nav() {
  const [location] = useLocation();

  return (
    <header className="app-header">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="logo-mark">SM</div>
          <span className="text-xl font-serif text-white tracking-wide">StyleMate</span>
        </Link>

        <div className="flex items-center gap-6">
          <WeatherWidget />

          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`nav-link ${location === "/" ? "active" : ""}`}
            >
              <Wand2 size={16} />
              <span className="hidden sm:inline">Outfits</span>
            </Link>
            <Link
              href="/wardrobe"
              className={`nav-link ${location === "/wardrobe" ? "active" : ""}`}
            >
              <Shirt size={16} />
              <span className="hidden sm:inline">Wardrobe</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/wardrobe" component={WardrobePage} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Nav />
      <Router />
    </WouterRouter>
  );
}

export default App;
