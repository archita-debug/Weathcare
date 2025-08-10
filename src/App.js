import React from 'react';
import Header from './components/Header';
import WeatherMap from './components/WeatherMap';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="main-content">
        <div className="container">
          <WeatherMap />
        </div>
      </main>
      <Footer />
    </div>
  );
}
