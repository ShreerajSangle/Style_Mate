import { useEffect, useState } from "react";
import { getDublinWeather, getWeatherIcon, type WeatherData } from "@/lib/weather";

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDublinWeather()
      .then(setWeather)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="weather-pill">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-pill">
      <span>{getWeatherIcon(weather.code)}</span>
      <span className="font-semibold">{Math.round(weather.temp)}°C</span>
      <span className="text-gold/70">{weather.label}</span>
      <span className="text-gold/50 text-xs">Dublin</span>
    </div>
  );
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDublinWeather()
      .then(setWeather)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { weather, loading, error };
}
