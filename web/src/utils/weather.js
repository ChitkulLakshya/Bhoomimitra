const CACHE_KEY = 'bhoomimitra.weather.cache.v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

const DEFAULT_LOCATION = {
  latitude: 12.7089,
  longitude: 77.6968,
};

const WEATHER_CODE_LABELS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

const getStoredCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.savedAt) return null;

    if (Date.now() - new Date(parsed.savedAt).getTime() > CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const setStoredCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      data,
    }));
  } catch {
    // Ignore storage failures in private/incognito modes.
  }
};

export const formatWeatherTime = (isoValue, locale = 'en-US') => {
  if (!isoValue) return '—';

  try {
    return new Date(isoValue).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const getCachedWeatherReport = () => getStoredCache();

export const getBrowserLocation = () => new Promise((resolve, reject) => {
  if (!('geolocation' in navigator)) {
    reject(new Error('Geolocation is not supported by this browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => reject(error),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    }
  );
});

export const getFallbackLocation = () => DEFAULT_LOCATION;

export const getFallbackWeatherLocation = () => DEFAULT_LOCATION;

const getWeatherCondition = (code) => WEATHER_CODE_LABELS[code] || 'Current conditions';

export const getWeatherReport = async (latitude, longitude) => {
  const weatherParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,rain,showers,weather_code,cloud_cover,surface_pressure,soil_temperature_0cm,uv_index,visibility',
    daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
  });

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;

  // Open-Meteo's Geocoding API supports forward search, not reverse lookup.
  // Keep reverse geocoding out of this request so a missing locality name
  // cannot produce browser CORS/404 noise or affect live weather.
  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error('Failed to fetch live weather.');
  }

  const data = await weatherResponse.json();
  const current = data?.current || data?.current_weather || {};
  const daily = data?.daily || {};

  const report = {
    locationName: 'Current location',
    latitude,
    longitude,
    temperatureC: current.temperature_2m ?? current.temperature ?? null,
    apparentTemperatureC: current.apparent_temperature ?? null,
    dewPointC: current.dew_point_2m ?? null,
    soilTemperatureC: current.soil_temperature_0cm ?? null,
    humidity: current.relative_humidity_2m ?? null,
    windSpeed: current.wind_speed_10m ?? current.windspeed ?? null,
    windDirection: current.wind_direction_10m ?? null,
    windGusts: current.wind_gusts_10m ?? null,
    precipitationMm: current.precipitation ?? null,
    rainMm: current.rain ?? null,
    showersMm: current.showers ?? null,
    cloudCover: current.cloud_cover ?? null,
    surfacePressure: current.surface_pressure ?? null,
    uvIndex: current.uv_index ?? null,
    visibilityKm: current.visibility != null ? current.visibility / 1000 : null,
    weatherCode: current.weather_code ?? current.weathercode ?? null,
    condition: getWeatherCondition(current.weather_code ?? current.weathercode ?? null),
    sunrise: daily.sunrise?.[0] || null,
    sunset: daily.sunset?.[0] || null,
    highTemperatureC: daily.temperature_2m_max?.[0] ?? null,
    lowTemperatureC: daily.temperature_2m_min?.[0] ?? null,
    uvIndexMax: daily.uv_index_max?.[0] ?? null,
    precipitationProbability: daily.precipitation_probability_max?.[0] ?? null,
    maxWindSpeed: daily.wind_speed_10m_max?.[0] ?? null,
    updatedAt: current.time || new Date().toISOString(),
    source: 'live',
  };

  setStoredCache(report);
  return report;
};

export const getWeatherReportWithFallback = async ({ latitude, longitude } = {}) => {
  const cached = getStoredCache();
  const lat = latitude ?? cached?.latitude ?? DEFAULT_LOCATION.latitude;
  const lng = longitude ?? cached?.longitude ?? DEFAULT_LOCATION.longitude;

  try {
    return await getWeatherReport(lat, lng);
  } catch (error) {
    if (cached) {
      return { ...cached, source: 'cache', error: error.message };
    }

    return {
      locationName: 'Current location',
      latitude: lat,
      longitude: lng,
      temperatureC: null,
      apparentTemperatureC: null,
      dewPointC: null,
      soilTemperatureC: null,
      humidity: null,
      windSpeed: null,
      windDirection: null,
      windGusts: null,
      precipitationMm: null,
      rainMm: null,
      showersMm: null,
      cloudCover: null,
      surfacePressure: null,
      uvIndex: null,
      visibilityKm: null,
      weatherCode: null,
      condition: 'Weather unavailable',
      sunrise: null,
      sunset: null,
      highTemperatureC: null,
      lowTemperatureC: null,
      uvIndexMax: null,
      precipitationProbability: null,
      maxWindSpeed: null,
      updatedAt: null,
      source: 'fallback',
      error: error.message,
    };
  }
};
