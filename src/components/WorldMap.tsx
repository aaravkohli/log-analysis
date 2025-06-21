import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Use a TopoJSON world map (can be local or from CDN)
const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Example: country coordinates (add more as needed)
const countryCoords: Record<string, [number, number]> = {
  "United States": [-98.35, 39.50],
  "China": [104.19, 35.86],
  "Germany": [10.45, 51.16],
  "Russia": [105.32, 61.52],
  "India": [78.96, 20.59],
  // ...add more as needed
};

const statusColors: Record<string, string> = {
  allowed: "#22c55e",    // green
  restricted: "#ef4444", // red
  monitored: "#facc15",  // yellow
};

export interface CountryStat {
  name: string;
  count: number;
  status: "allowed" | "restricted" | "monitored";
}

interface WorldMapProps {
  countryStats: CountryStat[];
}

const WorldMap: React.FC<WorldMapProps> = ({ countryStats }) => (
  <ComposableMap projection="geoEqualEarth" width={800} height={400}>
    <Geographies geography={geoUrl}>
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="#181c2a"
            stroke="#23263a"
            strokeWidth={0.5}
          />
        ))
      }
    </Geographies>
    {countryStats.map((country) => {
      const coords = countryCoords[country.name];
      if (!coords) return null;
      return (
        <Marker key={country.name} coordinates={coords}>
          <circle
            r={10}
            fill={statusColors[country.status]}
            stroke="#fff"
            strokeWidth={2}
            opacity={0.9}
          />
          <text
            textAnchor="middle"
            y={4}
            fontSize={12}
            fill="#fff"
            fontWeight="bold"
          >
            {country.count}
          </text>
        </Marker>
      );
    })}
  </ComposableMap>
);

export default WorldMap;
