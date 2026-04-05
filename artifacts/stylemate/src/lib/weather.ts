export type WeatherData = {
  temp: number;
  label: string;
  code: number;
};

function getWeatherLabel(code: number): string {
  if (code === 0) return "Sunny";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rainy";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Overcast";
}

export async function getDublinWeather(): Promise<WeatherData> {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,weather_code&timezone=Europe/Dublin"
  );
  const data = await res.json();
  const code = data.current.weather_code as number;
  const temp = data.current.temperature_2m as number;
  const label = getWeatherLabel(code);
  return { temp, label, code };
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([61, 63, 65].includes(code)) return "🌧️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌥️";
}
