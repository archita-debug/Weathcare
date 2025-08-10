import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import axios from 'axios';
import '../App.css';

export default function WeatherMap() {
  const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;
  console.log("Loaded API Key:", API_KEY);

  if (!API_KEY) {
    console.error("❌ Missing API key. Set REACT_APP_OPENWEATHER_KEY in your .env file.");
  }

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [cityInput, setCityInput] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current).setView([20, 78], 4); // Center on India initially
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      try { mapInstance.current.removeLayer(m); } catch (e) {}
    });
    markersRef.current = [];
  };

  const centerMapAndMark = (lat, lon, label) => {
    if (!mapInstance.current) return;
    mapInstance.current.setView([lat, lon], 12);
    clearMarkers();
    const marker = L.marker([lat, lon]).addTo(mapInstance.current).bindPopup(label || '').openPopup();
    markersRef.current.push(marker);
  };

  const groupByDay = (list) => {
    const days = {};
    list.forEach((entry) => {
      const date = new Date(entry.dt * 1000);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!days[dayLabel]) days[dayLabel] = [];
      days[dayLabel].push({
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: entry.main.temp,
        feelsLike: entry.main.feels_like,
        pressure: entry.main.pressure,
        humidity: entry.main.humidity,
        visibility: entry.visibility / 1000,
        windSpeed: entry.wind.speed,
        windDeg: entry.wind.deg,
        clouds: entry.clouds.all,
        description: entry.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`, // HTTPS fix
      });
    });
    return days;
  };

  const fetchByCity = async (cityName) => {
    if (!cityName) { setError('Please enter a valid city name.'); return; }
    setError('');
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
      );
      if (res.data && res.data.cod === '200') {
        const days = groupByDay(res.data.list);
        setForecastData({ city: res.data.city, days });
        centerMapAndMark(res.data.city.coord.lat, res.data.city.coord.lon, `${res.data.city.name}`);
      } else {
        setForecastData(null);
        setError('City not found. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setForecastData(null);
      setError('Error fetching weather data. Try again later.');
    }
  };

const fetchByLocation = () => {
  if (!navigator.geolocation) {
    setError('Geolocation is not supported by your browser.');
    return;
  }
  setError('');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      console.log("📍 Lat:", lat, "Lon:", lon);
      console.log("🔑 API Key:", API_KEY);
      const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      console.log("🌐 API URL:", apiUrl);

      try {
        const res = await axios.get(apiUrl);
        console.log("✅ API Response:", res.data);

        if (res.data && res.data.cod === '200') {
          const days = groupByDay(res.data.list);
          setForecastData({ city: res.data.city, days });
          centerMapAndMark(lat, lon, 'You are here!');
        } else {
          console.error("❌ API returned an error:", res.data);
          setForecastData(null);
          setError(res.data.message || 'Location not found. Please try again.');
        }
      } catch (err) {
        console.error("❌ Axios error object:", err);
        if (err.response) {
          console.error("🔴 API error response:", err.response.data);
          setError(`API Error: ${err.response.data.message}`);
        } else {
          setError('Network or CORS error — check console for details.');
        }
      }
    },
    (err) => {
      console.error("❌ Geolocation error:", err);
      setError('Unable to retrieve location. Check your browser/location settings.');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

  const handleSearch = (e) => { 
    e.preventDefault(); 
    fetchByCity(cityInput.trim()); 
  };

  return (
    <div className="weather-map-wrapper">
      <div className="controls">
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="Enter city or location name..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn">Search</button>
        </form>
        <button onClick={fetchByLocation} className="btn location-btn">My Location</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div id="map" ref={mapRef} className="map-box" />

      {forecastData && forecastData.city && (
        <section className="forecast-section">
          <div className="weather-info">
            <h2>Weather Forecast for {forecastData.city.name}, {forecastData.city.country}</h2>
          </div>

          {Object.entries(forecastData.days).map(([dayLabel, items]) => (
            <div key={dayLabel} className="day-forecast">
              <h3 className="day-title">{dayLabel}</h3>
              <div className="horizontal">
                {items.map((f, i) => (
                  <div className="forecast-card" key={i}>
                    <p className="time"><strong>{f.time}</strong></p>
                    <img src={f.icon} alt={f.description} className="weather-icon" />
                    <p className="temp">{Math.round(f.temp)}°C</p>
                    <p className="feels">Feels: {Math.round(f.feelsLike)}°C</p>
                    <p className="desc">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
