import React, { useEffect, useMemo, useRef, useState } from "react";

const SENSOR_IDS = ["S1", "S2", "S3", "S4"];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function nowISO() {
  return new Date().toISOString();
}

function toCSV(rows) {
  const header = ["timestamp", "sensor", "pressure_kPa", "temp_C", "humidity_pct"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([r.ts, r.sensor, r.p, r.t, r.h].map(v => `"${String(v)}"`).join(","));
  }
  return lines.join("\n");
}

function download(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  // Mode: mock (works now) or api (ready for real data)
  const [mode, setMode] = useState("mock"); // "mock" | "api"
  const [apiUrl, setApiUrl] = useState("https://example.com/api/latest"); // placeholder
  const [intervalMs, setIntervalMs] = useState(800);
  const [running, setRunning] = useState(true);

  const [latest, setLatest] = useState({});
  const [rows, setRows] = useState([]);

  const baseRef = useRef(
    Object.fromEntries(SENSOR_IDS.map(id => [id, { p: 101.3, t: 28.0, h: 55.0 }]))
  );
  const seqRef = useRef(0);

  // MOCK STREAM (works offline)
  useEffect(() => {
    if (mode !== "mock" || !running) return;

    const timer = setInterval(() => {
      const ts = nowISO();
      const base = baseRef.current;
      const batch = [];

      for (const id of SENSOR_IDS) {
        base[id].p = clamp(base[id].p + (Math.random() - 0.5) * 0.8, 90, 120);
        base[id].t = clamp(base[id].t + (Math.random() - 0.5) * 0.35, 18, 45);
        base[id].h = clamp(base[id].h + (Math.random() - 0.5) * 1.2, 20, 90);

        batch.push({
          ts,
          seq: ++seqRef.current,
          sensor: id,
          p: base[id].p.toFixed(2),
          t: base[id].t.toFixed(2),
          h: base[id].h.toFixed(2),
        });
      }

      setLatest(prev => {
        const u = { ...prev };
        for (const r of batch) u[r.sensor] = r;
        return u;
      });

      setRows(prev => [...batch, ...prev].slice(0, 200));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [mode, running, intervalMs]);

  // API MODE (ready for real backend)
  useEffect(() => {
    if (mode !== "api" || !running) return;

    const timer = setInterval(async () => {
      try {
        // Expected API response format (example):
        // { "ts": "...", "readings": [{"sensor":"S1","p":101.2,"t":28.1,"h":54.9}, ...] }
        const res = await fetch(apiUrl);
        const data = await res.json();

        const ts = data.ts || nowISO();
        const readings = Array.isArray(data.readings) ? data.readings : [];
        const batch = readings.map(r => ({
          ts,
          seq: ++seqRef.current,
          sensor: String(r.sensor || ""),
          p: Number(r.p).toFixed(2),
          t: Number(r.t).toFixed(2),
          h: Number(r.h).toFixed(2),
        }));

        setLatest(prev => {
          const u = { ...prev };
          for (const r of batch) u[r.sensor] = r;
          return u;
        });

        setRows(prev => [...batch, ...prev].slice(0, 200));
      } catch {
        // ignore fetch errors for MVP
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [mode, running, intervalMs, apiUrl]);

  const latestList = useMemo(
    () => SENSOR_IDS.map(id => latest[id]).filter(Boolean),
    [latest]
  );

  function exportCSV() {
    const csv = toCSV([...rows].reverse());
    download(`livedash_export_${Date.now()}.csv`, csv, "text/csv");
  }

  function reset() {
    setLatest({});
    setRows([]);
    seqRef.current = 0;
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="title">LiveDash Cloud</h1>
          <p className="subtitle">
            Real time monitoring dashboard. Mock now, API ready for real sensors.
          </p>
        </div>

        <div className="right">
          <button className="btn" onClick={() => setRunning(s => !s)}>
            {running ? "Pause" : "Start"}
          </button>
          <button className="btn ghost" onClick={exportCSV}>Export CSV</button>
          <button className="btn danger" onClick={reset}>Reset</button>
        </div>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="field">
            <label>Mode</label>
            <select className="input" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="mock">Mock Stream (works now)</option>
              <option value="api">API Mode (real data)</option>
            </select>
          </div>

          <div className="field">
            <label>Update interval (ms)</label>
            <input
              type="number"
              className="input"
              min={200}
              max={5000}
              value={intervalMs}
              onChange={e => setIntervalMs(Number(e.target.value) || 800)}
            />
          </div>

          {mode === "api" && (
            <div className="field wide">
              <label>API URL</label>
              <input
                className="input"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="https://your-api.com/latest"
              />
            </div>
          )}

          <div className="meta">
            <div className="pill">Sensors {SENSOR_IDS.length}</div>
            <div className="pill">Rows {rows.length}</div>
          </div>
        </div>

        <div className="grid">
          {latestList.map(r => (
            <div key={r.sensor} className="tile">
              <div className="tileHead">
                <div className="sensor">{r.sensor}</div>
                <div className="stamp">{r.ts.replace("T", " ").replace("Z", "")}</div>
              </div>
              <div className="kv">
                <div><span>Pressure</span><b>{r.p} kPa</b></div>
                <div><span>Temp</span><b>{r.t} C</b></div>
                <div><span>Humidity</span><b>{r.h} %</b></div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="h2">Recent readings</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Sensor</th>
                <th>Pressure (kPa)</th>
                <th>Temp (C)</th>
                <th>Humidity (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.seq}>
                  <td className="mono">{r.ts}</td>
                  <td>{r.sensor}</td>
                  <td>{r.p}</td>
                  <td>{r.t}</td>
                  <td>{r.h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="footer">
        Deploy this on Netlify to use anywhere. Later connect Arduino data via an API.
      </footer>
    </div>
  );
}