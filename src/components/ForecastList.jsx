import React from "react";
import WeatherCard from "./WeatherCard";

export default function ForecastList({ data }) {
  return (
    <div className="forecast-list">
      {data.map((day, index) => (
        <WeatherCard key={index} day={day} />
      ))}
    </div>
  );
}
