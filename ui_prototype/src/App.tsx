import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  addEvent,
  fields,
  labels,
  initialState,
  importRows,
  ping,
  topology,
  type Device,
  type Draft,
  type State,
  type Status,
} from "./model";
const STORAGE = "fdns-react-demo-v1";
const url = (page: string, network?: string) =>
  `#/${page}${network ? "?network=" + encodeURIComponent(network) : ""}`;
const detailUrl = (id: number, tab = "overview") =>
  `#/devices/${id}?tab=${tab}`;
const statuses: Status[] = ["Online", "Down", "Degraded", "Unknown"];
function Badge({ value }: { value: Status }) {
  return (
    <span className={"status " + value.toLowerCase()}>
      <i />
      {value}
    </span>
  );
}
function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
function getStored(): State {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (
      data?.version === 1 &&
      Array.isArray(data.devices) &&
      Array.isArray(data.events) &&
      Array.isArray(data.alerts)
    )
      return data;
  } catch {
    /* Storage unavailable: use in-memory demo. */
  }
  return initialState();
}
export default function App() {
  const [state, setState] = useState<State>(getStored);
  const [hash, setHash] = useState(location.hash || "#/");
  const [flash, setFlash] = useState("");
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    const listener = () => {
      setHash(location.hash || "#/");
      setFlash("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
      setSaveError("");
    } catch {
      setSaveError(
        "Browser storage is unavailable or full. Changes will only last for this session.",
      );
    }
  }, [state]);
  const [path, query = ""] = hash.slice(1).split("?");
  const params = new URLSearchParams(query);
  const network = params.get("network") || "Base Alpha";
  const networks = [...new Set(state.devices.map((d) => d.network))].sort();
  const page = path.startsWith("/devices")
    ? "devices"
    : path === "/topology"
      ? "topology"
      : path === "/import"
        ? "import"
        : "home";
  const d = state.devices.find((d) => path === `/devices/${d.id}`);
  const title = d
    ? d.name
    : path === "/devices/add"
      ? "Add device"
      : page === "devices"
        ? "Network inventory"
        : page === "topology"
          ? "Network topology"
          : page === "import"
            ? "Import inventory"
            : "Operations overview";
  useEffect(() => {
    document.title = title + " · f-dns";
  }, [title]);
  const alertCount = state.alerts.filter((a) => !a.acknowledged).length;
  function tabs(endpoint: string) {
    return (
      <nav className="network-tabs" aria-label="Networks">
        {networks.map((n) => (
          <a
            key={n}
            className={n === network ? "selected" : ""}
            href={url(endpoint, n)}
          >
            {n} <span>↗</span>
          </a>
        ))}
      </nav>
    );
  }
  function action(kind: string, device: Device, note = "") {
    let next = state;
    let message = "";
    if (kind === "ping") {
      message = ping(device.status);
      next = addEvent(state, device.id, "Simulated ping · Matt", message);
    }
    if (kind === "notify") {
      message = "Demo notification recorded for " + device.engineers + ".";
      next = addEvent(
        state,
        device.id,
        "Demo notification queued",
        `Assigned engineers: ${device.engineers}. No external message was sent.`,
      );
    }
    if (kind === "note") {
      if (!note.trim()) return;
      message = "Diagnosis added to the audit trail.";
      next = addEvent(state, device.id, "Engineer note · Matt", note.trim());
    }
    if (kind === "resolve") {
      message = "Device marked online in the demo.";
      next = addEvent(
        {
          ...state,
          devices: state.devices.map((d) =>
            d.id === device.id
              ? { ...d, status: "Online", error: "", downtime: "—" }
              : d,
          ),
          alerts: state.alerts.map((a) =>
            a.deviceId === device.id ? { ...a, acknowledged: true } : a,
          ),
        },
        device.id,
        "Demo recovery recorded",
        `Previous reported downtime: ${device.downtime}. Device marked online manually; no real reset performed. Historical uptime remains unchanged.`,
      );
    }
    setState(next);
    const nextHash = detailUrl(device.id, "metadata");
    history.replaceState(null, "", nextHash);
    setHash(nextHash);
    setFlash(message);
  }
  function timeline(events: State["events"], compact = false) {
    return (
      <div className={"timeline " + (compact ? "compact" : "")}>
        {[...events]
          .sort((a, b) => b.id - a.id)
          .map((e) => (
            <article key={e.id}>
              <small>{e.time}</small>
              <strong>{e.title}</strong>
              {compact ? (
                <a href={detailUrl(e.deviceId)}>
                  {state.devices.find((d) => d.id === e.deviceId)?.name} ↗
                </a>
              ) : (
                <p>{e.detail}</p>
              )}
            </article>
          ))}
        {!events.length && <p>No activity recorded.</p>}
      </div>
    );
  }
  const inventory = state.devices.filter((d) => d.network === network);
  let content: ReactNode;
  if (path === "/" || path === "")
    content = (
      <>
        <Heading
          eyebrow="NETWORK OPERATIONS"
          title="Operations overview"
          description="Your networks at a glance. Prioritize issues and keep teams informed."
        >
          <a className="button primary" href={url("devices")}>
            View devices ↗
          </a>
        </Heading>
        <div className="stats">
          {[
            [
              "Total devices",
              state.devices.length,
              `Across ${networks.length} networks`,
            ],
            [
              "Online",
              state.devices.filter((d) => d.status === "Online").length,
              "Responding normally",
            ],
            [
              "Down",
              state.devices.filter((d) => d.status === "Down").length,
              "Requires investigation",
            ],
            [
              "Degraded / unknown",
              state.devices.filter((d) =>
                ["Degraded", "Unknown"].includes(d.status),
              ).length,
              "Review health checks",
            ],
          ].map(([name, count, note]) => (
            <article key={name}>
              <span>{name}</span>
              <strong className={name === "Down" ? "red-text" : ""}>
                {count}
              </strong>
              <small>{note}</small>
            </article>
          ))}
        </div>
        <div className="overview-grid">
          <Panel
            title="Attention required"
            aside={<span className="count">{alertCount}</span>}
          >
            <div id="alerts">
              {[...state.alerts]
                .sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged))
                .map((a) => {
                  const d = state.devices.find((d) => d.id === a.deviceId)!;
                  return (
                    <article
                      key={a.id}
                      className={
                        "alert-card " + (a.acknowledged ? "acknowledged" : "")
                      }
                    >
                      <div className={"alert-icon " + a.severity.toLowerCase()}>
                        !
                      </div>
                      <div className="alert-body">
                        <div className="alert-top">
                          <span
                            className={"severity " + a.severity.toLowerCase()}
                          >
                            {a.severity}
                          </span>
                          <span className="muted">{d.network}</span>
                        </div>
                        <h3>
                          <a href={detailUrl(d.id)}>{a.title}</a>
                        </h3>
                        <a className="mono device-link" href={detailUrl(d.id)}>
                          {d.domain} ↗
                        </a>
                        <p>Assigned to {d.engineers}</p>
                        <div className="alert-actions">
                          <a className="text-link" href={detailUrl(d.id)}>
                            Investigate →
                          </a>
                          {a.acknowledged ? (
                            <span className="muted">✓ Acknowledged</span>
                          ) : (
                            <button
                              className="button small"
                              onClick={() => {
                                setState(
                                  addEvent(
                                    {
                                      ...state,
                                      alerts: state.alerts.map((old) =>
                                        old.id === a.id
                                          ? { ...old, acknowledged: true }
                                          : old,
                                      ),
                                    },
                                    d.id,
                                    "Alert acknowledged · Matt",
                                    a.title,
                                  ),
                                );
                                setFlash(
                                  "Alert acknowledged. The device status has not changed.",
                                );
                              }}
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </Panel>
          <div className="right-column">
            <Panel
              title="Network health"
              aside={<span className="muted">Inventory</span>}
            >
              {networks.map((n) => {
                const nd = state.devices.filter((d) => d.network === n);
                const healthy = nd.filter((d) => d.status === "Online").length;
                return (
                  <a className="network-row" href={url("devices", n)} key={n}>
                    <div>
                      <strong>{n}</strong>
                      <span>
                        {healthy}/{nd.length} online
                      </span>
                    </div>
                    <progress
                      value={healthy}
                      max={nd.length}
                      aria-label={n + " online devices"}
                    />
                  </a>
                );
              })}
              <a className="panel-link" href={url("topology")}>
                Explore network topology ↗
              </a>
            </Panel>
            <Panel
              title="Recent activity"
              aside={<span className="live-dot" />}
            >
              {timeline(state.events.slice(-5), true)}
            </Panel>
          </div>
        </div>
      </>
    );
  else if (path === "/devices")
    content = (
      <>
        <Heading
          eyebrow="INVENTORY"
          title="Network devices"
          description="Manage addresses, monitor health, and find the engineer responsible."
        >
          <a className="button" href={url("import")}>
            ↥ Import Excel
          </a>
          <a className="button primary" href={url("devices/add", network)}>
            ＋ Add device
          </a>
        </Heading>
        {tabs("devices")}
        <Inventory key={network} devices={inventory} network={network} />
      </>
    );
  else if (path === "/devices/add")
    content = (
      <>
        <a className="back-link" href={url("devices", network)}>
          ← Back to inventory
        </a>
        <Heading
          eyebrow="INVENTORY"
          title="Add a device"
          description="Create an inventory entry. Health stays unknown until monitoring is connected."
        />
        <section className="panel padded form-panel">
          <AddDevice
            network={network}
            networks={networks}
            onAdd={(draft) => {
              const next = importRows(state, [draft]);
              setState(next);
              location.hash = detailUrl(next.devices.at(-1)!.id);
            }}
          />
        </section>
      </>
    );
  else if (d) {
    const metadata = params.get("tab") === "metadata";
    content = (
      <>
        <a className="back-link" href={url("devices", d.network)}>
          ← {d.network} / Devices
        </a>
        <Heading
          eyebrow={`${d.kind} · ${d.location || "Location unspecified"}`}
          title={
            <>
              {d.name} <Badge value={d.status} />
            </>
          }
          description={d.domain}
        >
          <button className="button" onClick={() => action("notify", d)}>
            Notify engineers · demo
          </button>
          <button className="button primary" onClick={() => action("ping", d)}>
            ↗ Run simulated ping
          </button>
        </Heading>
        {d.error && (
          <div className="incident-banner">
            <strong>{d.error}</strong>
            <span>Reported downtime: {d.downtime}</span>
          </div>
        )}
        <div className="detail-tabs" role="tablist" aria-label="Device details">
          {["overview", "metadata"].map((tab, i) => (
            <button
              id={tab + "-tab"}
              key={tab}
              role="tab"
              aria-selected={metadata === (i === 1)}
              aria-controls={tab + "-panel"}
              tabIndex={metadata === (i === 1) ? 0 : -1}
              className={metadata === (i === 1) ? "selected" : ""}
              onClick={() => {
                const target = detailUrl(d.id, tab);
                history.replaceState(null, "", target);
                setHash(target);
              }}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const target =
                    e.key === "Home"
                      ? "overview"
                      : e.key === "End"
                        ? "metadata"
                        : metadata
                          ? "overview"
                          : "metadata";
                  const hash = detailUrl(d.id, target);
                  history.replaceState(null, "", hash);
                  setHash(hash);
                  document.getElementById(target + "-tab")?.focus();
                }
              }}
            >
              {i ? "Metadata & activity" : "Overview"}
            </button>
          ))}
        </div>
        {!metadata ? (
          <section
            role="tabpanel"
            id="overview-panel"
            aria-labelledby="overview-tab"
          >
            <div className="detail-grid">
              <Panel
                title="Device information"
                aside={<span className="muted">DNS record</span>}
              >
                <dl className="properties">
                  {[
                    ["Domain name", d.domain],
                    ["IPv4 address", d.ipv4],
                    ["IPv6 address", d.ipv6 || "Not assigned"],
                    ["Network", d.network],
                    ["Device type", d.kind],
                    ["Location", d.location || "Not specified"],
                    ["Upstream device", d.parent || "Root / not specified"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <div className="right-column">
                <section className="panel uptime">
                  <div className="eyebrow">30-DAY UPTIME · SAMPLE DATA</div>
                  <div className="uptime-number">
                    {d.uptime?.toFixed(2) ?? "—"}
                    <small>%</small>
                  </div>
                  <p>
                    {d.uptime === null
                      ? "No monitoring history yet"
                      : d.uptime < 99.9
                        ? "Below the 99.9% target"
                        : "Meeting the 99.9% target"}
                  </p>
                  <progress
                    value={d.uptime ?? 0}
                    max={100}
                    aria-label="30 day sample uptime"
                  />
                  <small className="muted">
                    Historical sample; demo actions do not recalculate uptime.
                  </small>
                </section>
                <Panel title="Assigned engineers">
                  {d.engineers.split(",").map((engineer, i) => (
                    <div className="engineer" key={i}>
                      <span className="avatar">{engineer.trim()[0]}</span>
                      <div>
                        <strong>{engineer.trim()}</strong>
                        <small>Device maintenance</small>
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>
            </div>
          </section>
        ) : (
          <section
            role="tabpanel"
            id="metadata-panel"
            aria-labelledby="metadata-tab"
          >
            <div className="detail-grid">
              <Panel
                title="Audit trail"
                aside={<span className="muted">Newest first</span>}
              >
                {timeline(state.events.filter((e) => e.deviceId === d.id))}
              </Panel>
              <section className="panel padded">
                <h2>Record a diagnosis</h2>
                <p className="muted">Add context for the next engineer.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    action(
                      "note",
                      d,
                      String(new FormData(e.currentTarget).get("note")),
                    );
                    e.currentTarget.reset();
                  }}
                >
                  <label htmlFor="note">Investigation notes</label>
                  <textarea
                    id="note"
                    name="note"
                    rows={5}
                    required
                    maxLength={2000}
                    placeholder="Observed issue, diagnosis, and actions taken…"
                  />
                  <button className="button primary">Save note</button>
                </form>
                <hr />
                <h3>Simulate recovery</h3>
                <p className="muted">
                  Record the current downtime and mark this device online.
                  Downstream devices remain unchanged.
                </p>
                <button className="button" onClick={() => action("resolve", d)}>
                  Mark online · demo
                </button>
              </section>
            </div>
          </section>
        )}
      </>
    );
  } else if (path === "/topology") {
    const map = topology(inventory);
    content = (
      <>
        <Heading
          eyebrow="NETWORK VISIBILITY"
          title="Network topology"
          description="Trace shared failure points. Select a device to investigate."
        >
          <a className="button" href={url("devices", network)}>
            ▤ Device inventory
          </a>
        </Heading>
        {tabs("topology")}
        <Panel
          title={network}
          aside={
            <div className="legend">
              <Badge value="Online" />
              <Badge value="Down" />
              <Badge value="Degraded" />
            </div>
          }
        >
          <div className="table-footer">
            Generated from inventory parent relationships · {inventory.length}{" "}
            devices
          </div>
          <div className="map-scroll">
            <svg
              className="topology"
              width={map.width}
              height={map.height}
              viewBox={`0 0 ${map.width} ${map.height}`}
              aria-label={network + " topology"}
              role="img"
            >
              <defs>
                <pattern
                  id="grid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill="#dce5e9" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {map.edges.map((e) => (
                <path
                  key={e.id}
                  className={"edge " + e.status.toLowerCase()}
                  d={`M ${e.x1} ${e.y1} V ${(e.y1 + e.y2) / 2} H ${e.x2} V ${e.y2}`}
                />
              ))}
              {map.nodes.map((d) => (
                <a
                  key={d.id}
                  href={detailUrl(d.id)}
                  aria-label={d.name + ", " + d.status}
                >
                  <g
                    className={"node " + d.status.toLowerCase()}
                    transform={`translate(${d.x},${d.y})`}
                  >
                    <rect x="-105" y="-34" width="210" height="68" rx="9" />
                    <circle cx="-86" cy="-12" r="4" />
                    <text x="-74" y="-8" className="node-name">
                      {d.name.length > 23 ? d.name.slice(0, 20) + "…" : d.name}
                    </text>
                    <text x="-86" y="13" className="node-ip">
                      {d.ipv4} · {d.status}
                    </text>
                  </g>
                </a>
              ))}
            </svg>
          </div>
          <div className="table-footer">
            Topology preview{" "}
            <span>
              Scroll to explore larger networks · Select any node for details
            </span>
          </div>
        </Panel>
        <p className="muted map-note">
          Red links identify unreachable endpoints, not proven link failures.
          This prototype uses declared parent relationships; automatic discovery
          will come from your service.
        </p>
      </>
    );
  } else if (path === "/import")
    content = (
      <ImportInventory
        onImport={(rows) => {
          const next = importRows(state, rows);
          setState(next);
          location.hash = url("devices", next.devices.at(-1)!.network);
        }}
      />
    );
  else
    content = (
      <section className="panel padded">
        <h1>Not found</h1>
        <p>This device or page does not exist.</p>
        <a className="button primary" href="#/">
          Return home
        </a>
      </section>
    );
  return (
    <>
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="brand-icon">f</span> f-dns
          <span className="brand-dot">●</span>
        </a>
        <div className="workspace">
          <span className="eyebrow">WORKSPACE</span>
          <strong>Field operations</strong>
          <small>Network management console</small>
        </div>
        <nav aria-label="Main navigation">
          {[
            ["home", "▦", "Overview", ""],
            ["devices", "▤", "Devices", "devices"],
            ["topology", "⌘", "Topology", "topology"],
            ["import", "↥", "Import inventory", "import"],
          ].map(([p, icon, label, route]) => (
            <a className={page === p ? "active" : ""} href={url(route)} key={p}>
              <span>{icon}</span>
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="signal" /> Local demonstration
          <small>
            Synthetic network data
            <br />
            No live DNS or monitoring
          </small>
        </div>
        <div className="profile">
          <span className="avatar">MT</span>
          <div>
            <strong>Matt</strong>
            <small>Senior field engineer</small>
          </div>
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <div>
            Field operations <span className="slash">/</span> {title}
          </div>
          <div className="top-right">
            <span className="demo-pill">DEMO ENVIRONMENT</span>
            <a href="#/">
              Alerts <b>{alertCount}</b>
            </a>
          </div>
        </header>
        <main>
          {saveError && (
            <div className="flash error" role="alert">
              {saveError}
            </div>
          )}
          {flash && (
            <div className="flash" role="status">
              {flash}
            </div>
          )}
          {content}
          <footer>
            f-dns / Field network services{" "}
            <span>Prototype · all times UTC</span>
          </footer>
        </main>
      </div>
    </>
  );
}
function Inventory({
  devices,
  network,
}: {
  devices: Device[];
  network: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState({ q: "", status: "" });
  const ds = devices.filter(
    (d) =>
      (!filter.status || d.status === filter.status) &&
      (!filter.q ||
        [d.name, d.domain, d.ipv4, d.ipv6, d.engineers]
          .join(" ")
          .toLowerCase()
          .includes(filter.q.toLowerCase())),
  );
  return (
    <Panel
      title={network}
      aside={
        <a className="button" href={url("topology", network)}>
          ⌘ View topology
        </a>
      }
    >
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter({ q: q.trim(), status });
        }}
      >
        <label className="search">
          <span className="sr-only">Search devices</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, IP address, or engineer…"
          />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="button">Filter</button>
        {(filter.q || filter.status) && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setQ("");
              setStatus("");
              setFilter({ q: "", status: "" });
            }}
          >
            Clear
          </button>
        )}
      </form>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Device / domain",
                "Status",
                "IPv4 address",
                "IPv6 address",
                "Assigned engineers",
                "Health / errors",
                "",
              ].map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.map((d) => (
              <tr key={d.id}>
                <td>
                  <a className="device-name" href={detailUrl(d.id)}>
                    {d.name}
                  </a>
                  <small className="mono">{d.domain}</small>
                </td>
                <td>
                  <Badge value={d.status} />
                </td>
                <td className="mono">{d.ipv4}</td>
                <td className="mono">{d.ipv6 || "—"}</td>
                <td>{d.engineers}</td>
                <td className="error-cell">{d.error || "No active errors"}</td>
                <td>
                  <a href={detailUrl(d.id)} aria-label={"View " + d.name}>
                    ↗
                  </a>
                </td>
              </tr>
            ))}
            {!ds.length && (
              <tr>
                <td colSpan={7} className="empty">
                  No matching devices. Try a different search or add a device.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        Showing {ds.length} of {devices.length} devices{" "}
        <span>Click a device to inspect its metadata</span>
      </div>
    </Panel>
  );
}
function AddDevice({
  network,
  networks,
  onAdd,
}: {
  network: string;
  networks: string[];
  onAdd: (draft: Draft) => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onAdd(Object.fromEntries(new FormData(e.currentTarget)) as Draft);
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      {error && (
        <div className="flash error" role="alert">
          {error}
        </div>
      )}
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f}>
            {labels[f]}
            <input
              name={f}
              defaultValue={f === "network" ? network : ""}
              maxLength={255}
              required={["name", "domain", "ipv4", "network"].includes(f)}
              list={f === "network" ? "network-list" : undefined}
            />
          </label>
        ))}
      </div>
      <datalist id="network-list">
        {networks.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <p className="muted">
        Separate engineers with commas. A new network name creates a new tab.
      </p>
      <div className="actions">
        <button className="button primary">Create device</button>
        <a className="button" href={url("devices", network)}>
          Cancel
        </a>
      </div>
    </form>
  );
}
function ImportInventory({
  onImport,
}: {
  onImport: (rows: Partial<Draft>[]) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const file = new FormData(e.currentTarget).get("file") as File;
    try {
      if (!file?.name.toLowerCase().endsWith(".xlsx"))
        throw new Error("Choose an .xlsx workbook.");
      if (file.size > 4 * 1024 * 1024)
        throw new Error("Choose a workbook smaller than 4 MB.");
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("Workbook has no worksheet.");
      if (sheet.rowCount > 1001)
        throw new Error("Demo imports support up to 1,000 rows.");
      const headers: string[] = [];
      sheet
        .getRow(1)
        .eachCell(
          { includeEmpty: true },
          (cell, n) => (headers[n - 1] = cell.text.trim().toLowerCase()),
        );
      if (
        !["name", "domain", "ipv4", "network"].every((h) => headers.includes(h))
      )
        throw new Error("Required headers: name, domain, ipv4, network.");
      const rows: Partial<Draft>[] = [];
      for (let n = 2; n <= sheet.rowCount; n++) {
        const row = sheet.getRow(n);
        if (!row.hasValues) continue;
        const data: Partial<Draft> = {};
        headers.forEach((h, i) => {
          if (fields.includes(h as keyof Draft))
            data[h as keyof Draft] = row.getCell(i + 1).text;
        });
        rows.push(data);
      }
      onImport(rows);
    } catch (e) {
      setError(
        (e as Error).message ||
          "Unable to read workbook. Use the provided template.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="INVENTORY ONBOARDING"
        title="From spreadsheet to network"
        description="Import device records and organize them into network tabs."
      >
        <a className="button" href="./sample-inventory.xlsx" download>
          ↓ Download Excel template
        </a>
      </Heading>
      <div className="detail-grid">
        <section className="panel padded">
          <div className="upload-art">↥</div>
          <h2>Upload your device inventory</h2>
          <p className="muted">
            Excel workbook (.xlsx) · up to 4 MB · 1,000 devices
          </p>
          {error && (
            <div className="flash error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={upload}>
            <label htmlFor="file">Choose workbook</label>
            <input
              type="file"
              id="file"
              name="file"
              accept=".xlsx"
              required
              disabled={busy}
            />
            <p className="muted">
              All rows are validated before anything is saved. Duplicate domains
              or addresses within a network are rejected.
            </p>
            <button className="button primary" disabled={busy}>
              {busy ? "Importing…" : "Import devices"}
            </button>
          </form>
        </section>
        <section className="panel padded">
          <h2>A predictable import</h2>
          <ol className="steps">
            <li>
              <strong>Start with the template</strong>
              <p>Required columns: name, domain, ipv4, network.</p>
            </li>
            <li>
              <strong>Add context</strong>
              <p>
                Optional: ipv6, kind, engineers, location, parent. Parent is the
                upstream device’s domain name.
              </p>
            </li>
            <li>
              <strong>Review your network</strong>
              <p>
                New network names become tabs automatically. Imported devices
                begin with Unknown status.
              </p>
            </li>
          </ol>
          <div className="soft-note">
            Demo scope: imports create local inventory records. They do not
            provision DNS zones or configure devices.
          </div>
        </section>
      </div>
    </>
  );
}
