import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Weathcare | Built with React & Leaflet</p>
    </footer>
  );
}