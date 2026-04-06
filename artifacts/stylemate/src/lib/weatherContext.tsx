import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getDublinWeather, type WeatherData } from "./weather";

type WeatherCtx = {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
};

const WeatherContext = createContext<WeatherCtx>({ weather: null, loading: true, error: null });

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDublinWeather()
      .then(setWeather)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading, error }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
