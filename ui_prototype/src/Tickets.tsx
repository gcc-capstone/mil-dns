import { useState } from "react";
import {
  fields,
  labels,
  openTicket,
  finishTicket,
  type State,
  type Actor,
  type Draft,
  type TicketInput,
} from "./model";
export const ticketUrl = (id: number) => `#/tickets/${id}`;
export function Tickets({
  state,
  actor,
  path,
  params,
  networks,
  onChange,
}: {
  state: State;
  actor: Actor;
  path: string;
  params: URLSearchParams;
  networks: string[];
  onChange: (s: State) => void;
}) {
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Open");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TicketInput["type"]>(
    params.get("type") === "registration" ? "Device registration" : "Problem",
  );
  const device = state.devices.find(
    (d) => d.id === Number(params.get("device")),
  );
  const [network, setNetwork] = useState(
    device?.network || params.get("network") || networks[0],
  );
  const ticket = state.alerts.find((t) => path === `/tickets/${t.id}`);
  const mine = state.alerts.filter(
    (t) => actor.role === "admin" || t.createdBy === actor.name,
  );
  const heading = (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          {actor.role === "admin" ? "ADMIN WORKSPACE" : "SERVICE DESK"}
        </div>
        <h1>
          {path === "/tickets/new"
            ? "Open a ticket"
            : ticket
              ? `Ticket #${ticket.id}`
              : actor.role === "admin"
                ? "Ticket queue"
                : "My tickets"}
        </h1>
        <p>
          Register arriving devices and resolve requests on your enclosed
          network.
        </p>
      </div>
      <a className="button primary" href="#/tickets/new">
        ＋ Open ticket
      </a>
    </div>
  );
  function submit(form: HTMLFormElement) {
    const f = new FormData(form);
    try {
      const registration = Object.fromEntries(
        fields.map((k) => [k, String(f.get(k) || "")]),
      ) as Draft;
      const next = openTicket(state, actor, {
        title: String(f.get("title") || ""),
        description: String(f.get("description") || ""),
        priority: f.get("priority") as "Normal" | "High",
        type,
        network,
        deviceId:
          type === "Device registration"
            ? null
            : f.get("deviceId")
              ? Number(f.get("deviceId"))
              : null,
        registration,
      });
      onChange(next);
      location.hash = ticketUrl(next.alerts.at(-1)!.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (path === "/tickets/new")
    return (
      <>
        {heading}
        <section className="panel padded form-panel">
          {error && (
            <div className="flash error" role="alert">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(e.currentTarget);
            }}
          >
            <div className="form-grid">
              <label>
                Ticket type
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as TicketInput["type"])
                  }
                >
                  <option>Problem</option>
                  <option>Request</option>
                  <option>Device registration</option>
                </select>
              </label>
              <label>
                Priority
                <select name="priority">
                  <option>Normal</option>
                  <option>High</option>
                </select>
              </label>
              <label>
                Network
                <select
                  name="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  {networks.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              {type !== "Device registration" && (
                <label>
                  Related device (optional)
                  <select
                    key={network}
                    name="deviceId"
                    defaultValue={device?.network === network ? device.id : ""}
                  >
                    <option value="">Network-wide / no device</option>
                    {state.devices
                      .filter((d) => d.network === network)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label className="full-width">
                Title
                <input
                  name="title"
                  required
                  maxLength={160}
                  placeholder="What do you need help with?"
                />
              </label>
              <label className="full-width">
                Details
                <textarea
                  name="description"
                  required
                  maxLength={4000}
                  rows={4}
                  placeholder="Describe the request, expected behavior, or steps to reproduce the problem."
                />
              </label>
            </div>
            {type === "Device registration" && (
              <fieldset className="registration-fields">
                <legend>Requested device</legend>
                <p className="muted">
                  The device enters inventory only after an admin reviews and
                  approves this request.
                </p>
                <div className="form-grid">
                  {fields
                    .filter((f) => f !== "network")
                    .map((f) => (
                      <label key={f}>
                        {labels[f]}
                        <input
                          name={f}
                          maxLength={255}
                          required={["name", "domain", "ipv4"].includes(f)}
                        />
                      </label>
                    ))}
                </div>
              </fieldset>
            )}
            <div className="actions">
              <button className="button primary">Submit ticket</button>
              <a className="button" href="#/tickets">
                Cancel
              </a>
            </div>
          </form>
        </section>
      </>
    );
  if (ticket) {
    if (actor.role !== "admin" && ticket.createdBy !== actor.name)
      return (
        <section className="panel padded">
          <h1>Ticket unavailable</h1>
          <p>
            Regular users can view their own tickets. Switch to admin to review
            the full queue.
          </p>
          <a href="#/tickets" className="button">
            My tickets
          </a>
        </section>
      );
    return (
      <>
        <a className="back-link" href="#/tickets">
          ← Tickets
        </a>
        {heading}
        <div className="detail-grid">
          <section className="panel padded">
            <div className="ticket-tags">
              <span
                className={
                  "status " +
                  (ticket.resolved ? "online" : "online-open-ticket")
                }
              >
                {ticket.resolved ? "Closed" : "Open"}
              </span>
              <span>
                {ticket.type} · {ticket.priority} priority
              </span>
            </div>
            <h2>{ticket.title}</h2>
            <p className="preserve-lines">{ticket.description}</p>
            <dl className="properties">
              <div>
                <dt>Requested by</dt>
                <dd>{ticket.createdBy}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{ticket.createdAt}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{ticket.network}</dd>
              </div>
              {ticket.deviceId !== null && (
                <div>
                  <dt>Related device</dt>
                  <dd>
                    <a
                      className="text-link"
                      href={`#/devices/${ticket.deviceId}`}
                    >
                      {state.devices.find((d) => d.id === ticket.deviceId)
                        ?.name || "Device unavailable"}{" "}
                      ↗
                    </a>
                  </dd>
                </div>
              )}
              {ticket.resolved && (
                <>
                  <div>
                    <dt>Closed by</dt>
                    <dd>{ticket.closedBy || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Closed at</dt>
                    <dd>{ticket.closedAt || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Resolution</dt>
                    <dd className="preserve-lines">
                      {ticket.resolution || "Not recorded"}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <h3>Ticket activity</h3>
            <div className="timeline">
              {[...ticket.history].reverse().map((h, i) => (
                <article key={i}>
                  <small>
                    {h.time} · {h.actor}
                  </small>
                  <p className="preserve-lines">{h.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="panel padded">
            {error && (
              <div className="flash error" role="alert">
                {error}
              </div>
            )}
            {actor.role === "admin" && !ticket.resolved ? (
              <>
                <h2>
                  {ticket.registration
                    ? "Review device registration"
                    : "Resolve ticket"}
                </h2>
                <p className="muted">
                  {ticket.registration
                    ? "Correct the details before approving. Approval adds one device to the demo inventory."
                    : "Record the outcome before closing. Closing a ticket does not change device reachability."}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const intent = (
                      e.nativeEvent as SubmitEvent
                    ).submitter?.getAttribute("value");
                    try {
                      onChange(
                        finishTicket(
                          state,
                          actor,
                          ticket.id,
                          String(f.get("resolution") || ""),
                          intent === "approve",
                          Object.fromEntries(
                            fields.map((k) => [k, String(f.get(k) || "")]),
                          ) as Draft,
                        ),
                      );
                      setError("");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {ticket.registration && (
                    <div className="form-grid">
                      {fields.map((f) => (
                        <label key={f}>
                          {labels[f]}
                          <input
                            name={f}
                            defaultValue={ticket.registration![f]}
                            maxLength={255}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <label htmlFor="resolution">Resolution / decision note</label>
                  <textarea
                    id="resolution"
                    name="resolution"
                    required
                    maxLength={4000}
                    rows={4}
                  />
                  <div className="actions">
                    {ticket.registration && (
                      <button
                        className="button primary"
                        value="approve"
                        type="submit"
                      >
                        Approve & add device
                      </button>
                    )}
                    <button className="button" value="close" type="submit">
                      {ticket.registration
                        ? "Close without adding"
                        : "Close ticket"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>
                  {ticket.registration ? "Requested device" : "Ticket status"}
                </h2>
                <p className="muted">
                  {ticket.resolved
                    ? "This ticket is closed. Its history and resolution remain available."
                    : "Awaiting admin review. Switch to Matt (Admin) to review or close this ticket."}
                </p>
                {ticket.registration && (
                  <dl className="properties">
                    {fields.map((f) => (
                      <div key={f}>
                        <dt>{labels[f]}</dt>
                        <dd>{ticket.registration![f] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            )}
          </section>
        </div>
      </>
    );
  }
  if (path !== "/tickets")
    return (
      <section className="panel padded">
        <h1>Ticket not found</h1>
        <a href="#/tickets">Return to tickets</a>
      </section>
    );
  const visible = mine
    .filter(
      (t) =>
        (filter === "All" || (filter === "Closed") === t.resolved) &&
        `${t.id} ${t.title} ${t.description} ${t.network} ${t.createdBy}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.id - a.id);
  return (
    <>
      {heading}
      <div className="stats">
        {[
          ["Open", mine.filter((t) => !t.resolved).length],
          [
            "Device registrations",
            mine.filter((t) => !t.resolved && t.type === "Device registration")
              .length,
          ],
          ["Closed", mine.filter((t) => t.resolved).length],
        ].map(([label, count]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="filters">
          <label className="search">
            <span className="sr-only">Search tickets</span>
            <input
              type="search"
              placeholder="Search tickets, network, or requester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Ticket status</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>Open</option>
              <option>Closed</option>
              <option>All</option>
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Ticket",
                  "Type",
                  "Network",
                  "Requested by",
                  "Priority",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td>
                    <a className="device-name" href={ticketUrl(t.id)}>
                      #{t.id} · {t.title}
                    </a>
                    <small>{t.createdAt}</small>
                  </td>
                  <td>{t.type}</td>
                  <td>{t.network}</td>
                  <td>{t.createdBy}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span
                      className={
                        "status " +
                        (t.resolved ? "online" : "online-open-ticket")
                      }
                    >
                      {t.resolved ? "Closed" : "Open"}
                    </span>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="empty">
                    No matching tickets. Open a ticket to submit a request or
                    report a problem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
