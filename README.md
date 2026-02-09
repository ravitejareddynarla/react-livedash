# LiveDash Cloud

Real-time web dashboard for monitoring multi-sensor pressure, temperature, and humidity data.

Built to simulate and visualize industrial / laboratory sensor streams with live updates, charts, and export capabilities.

## Live Demo
https://livedash-sensordata.netlify.app/

## GitHub
https://github.com/ravitejareddynarla/react-livedash

---

## Features

- Real-time streaming sensor data
- Pressure / Temperature / Humidity cards
- Interactive charts (Recharts)
- Recent readings table
- CSV export
- Pause / Resume monitoring
- Mock mode (offline testing)
- API mode (connect real sensors)
- Deployable on any device via Netlify

---

## Screenshots

Add your screenshots here:

![Dashboard](screenshots/dashboard.png)
![Charts](screenshots/charts.png)

---

## Tech Stack

- React (Hooks)
- Vite
- Recharts
- JavaScript (ES6+)
- Netlify Deployment

---

## Project Architecture

Frontend:
React dashboard visualizes live data

Modes:
- Mock stream → simulated realistic values
- API mode → fetch JSON from backend

Backend ready format:

```json
{
  "ts": "2026-02-10T12:00:00.000Z",
  "readings": [
    { "sensor": "S1", "p": 101.2, "t": 28.1, "h": 54.9 }
  ]
}
