import { useWeather } from "@/lib/weatherContext";
import { getWeatherIcon } from "@/lib/weather";

export function WeatherWidget() {
  const { weather, loading, error } = useWeather();

  if (loading) {
    return (
      <div className="weather-pill">
        <span className="animate-pulse text-white/30">...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-pill" title="Weather unavailable">
        <span>🌡️</span>
        <span className="text-white/30 text-xs">Unavailable</span>
      </div>
    );
  }

  return (
    <div className="weather-pill">
      <span>{getWeatherIcon(weather.code)}</span>
      <span className="font-semibold">{Math.round(weather.temp)}°C</span>
      <span className="text-gold/70">{weather.label}</span>
      <span className="text-gold/50 text-xs">{weather.city}</span>
    </div>
  );
}
