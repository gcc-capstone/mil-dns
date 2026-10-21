import ipaddr from "ipaddr.js";
import seed from "./seed.json";

export type Status = "Online" | "Offline" | "Online-Open-Ticket" | "Unknown";

export interface Device {
  id: number;
  name: string;
  domain: string;
  ipv4: string;
  ipv6: string;
  network: string;
  kind: string;
  status: Status;
  engineers: string;
  location: string;
  parent: string;
  uptime: number | null;
  error: string;
  downtime: string;
}

export interface Event {
  id: number;
  deviceId: number;
  time: string;
  title: string;
  detail: string;
}

export interface Ticket {
  id: number;
  deviceId: number;
  title: string;
  description: string;
  priority: "High" | "Normal";
  resolved: boolean;
}

export interface State {
  version: 2;
  devices: Device[];
  events: Event[];
  alerts: Ticket[];
}

export const DEFAULT_NETWORKS = [
  "Unclassified",
  "Confidential",
  "Secret",
  "Top Secret",
] as const;

export const fields = [
  "name",
  "domain",
  "ipv4",
  "ipv6",
  "network",
  "kind",
  "engineers",
  "location",
  "parent",
] as const;

export type Draft = Record<(typeof fields)[number], string>;

export const labels: Record<keyof Draft, string> = {
  name: "Device name",
  domain: "Domain name",
  ipv4: "IPv4 address",
  ipv6: "IPv6 address (optional)",
  network: "Network",
  kind: "Device type",
  engineers: "Assigned engineers",
  location: "Location",
  parent: "Upstream domain (optional)",
};

export function now() {
  return new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function mapSeedNetworks(rawDevices: Device[]): Device[] {
  const legacyNetworks = [...new Set(rawDevices.map((d) => d.network))];
  return rawDevices.map((d, index) => {
    if (
      DEFAULT_NETWORKS.includes(
        d.network as (typeof DEFAULT_NETWORKS)[number],
      )
    ) {
      return d;
    }
    const netIndex = legacyNetworks.indexOf(d.network);
    const mappedNetwork =
      DEFAULT_NETWORKS[
        (netIndex >= 0 ? netIndex : index) % DEFAULT_NETWORKS.length
      ];
    return { ...d, network: mappedNetwork };
  });
}

export function initialState(): State {
  const devices = mapSeedNetworks(structuredClone(seed) as Device[]);
  return {
    version: 2,
    devices,
    alerts: [
      {
        id: 103,
        deviceId: 8,
        title: "Troubleshoot elevated latency on uplink interface",
        description:
          "Check duplex mismatch and physical transceiver diagnostics.",
        priority: "Normal",
        resolved: false,
      },
    ],
    events: [
      {
        id: 1,
        deviceId: 4,
        time: now(),
        title: "Ticket #101 opened",
        detail:
          "Ticket assigned to network engineers to investigate DNS timeout on operations server.",
      },
      {
        id: 2,
        deviceId: 5,
        time: now(),
        title: "Ticket #102 opened",
        detail:
          "Router trunk port configuration check queued for assigned field engineers.",
      },
      {
        id: 3,
        deviceId: 6,
        time: now(),
        title: "Previous ticket resolved",
        detail:
          "James diagnosed a stalled service and reset the server. Previous downtime: 46 minutes.",
      },
      {
        id: 4,
        deviceId: 8,
        time: now(),
        title: "Ticket #103 opened",
        detail:
          "Engineers requested to inspect uplink interface for elevated latency.",
      },
    ],
  };
}

export function addEvent(
  s: State,
  deviceId: number,
  title: string,
  detail: string,
): State {
  return {
    ...s,
    events: [
      ...s.events,
      {
        id: Math.max(0, ...s.events.map((e) => e.id)) + 1,
        deviceId,
        time: now(),
        title,
        detail,
      },
    ],
  };
}

export function validate(row: Partial<Draft>, existing: Device[]): Draft {
  const d = Object.fromEntries(
    fields.map((k) => [k, String(row[k] ?? "").trim()]),
  ) as Draft;
  for (const k of ["name", "domain", "ipv4", "network"] as const)
    if (!d[k]) throw new Error(`${k} is required`);
  d.domain = d.domain.toLowerCase().replace(/\.$/, "");
  d.parent = d.parent.toLowerCase().replace(/\.$/, "");
  if (
    d.domain.length > 253 ||
    d.domain
      .split(".")
      .some((p) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(p))
  )
    throw new Error("Invalid domain name");
  if (Object.values(d).some((v) => v.length > 255))
    throw new Error("Fields must be 255 characters or fewer");
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(d.ipv4) || !ipaddr.IPv4.isValid(d.ipv4))
    throw new Error("Invalid IPv4 address");
  d.ipv4 = d.ipv4.split(".").map(Number).join(".");
  if (d.ipv6) {
    if (!ipaddr.IPv6.isValid(d.ipv6)) throw new Error("Invalid IPv6 address");
    d.ipv6 = ipaddr.parse(d.ipv6).toString();
  }
  for (const old of existing) {
    if (old.domain === d.domain)
      throw new Error("Duplicate domain: " + d.domain);
    if (
      old.network === d.network &&
      (old.ipv4 === d.ipv4 ||
        (d.ipv6 && old.ipv6 && ipaddr.parse(old.ipv6).toString() === d.ipv6))
    )
      throw new Error("Duplicate address within network");
  }
  d.kind ||= "Endpoint";
  d.engineers ||= "Unassigned";
  return d;
}

export function importRows(state: State, rows: Partial<Draft>[]): State {
  if (!rows.length) throw new Error("Workbook has no device rows");
  if (rows.length > 1000)
    throw new Error("Demo imports support up to 1,000 devices");
  let next = { ...state, devices: [...state.devices] };
  for (const [i, row] of rows.entries()) {
    let d: Draft;
    try {
      d = validate(row, next.devices);
    } catch (e) {
      throw new Error(`Row ${i + 2}: ${(e as Error).message}`);
    }
    const id = Math.max(0, ...next.devices.map((d) => d.id)) + 1;
    next.devices.push({
      ...d,
      id,
      status: "Unknown",
      uptime: null,
      error: "Awaiting first health check",
      downtime: "—",
    });
    next = addEvent(
      next,
      id,
      "Device added",
      "Inventory record created. Monitoring has not been connected.",
    );
  }
  return next;
}

export function ping(status: Status) {
  return {
    Online: "4 packets sent, 4 received · 0% loss · average 2.4 ms",
    "Online-Open-Ticket": "4 packets sent, 4 received · 0% loss · average 2.4 ms",
    Offline: "4 packets sent, 0 received · 100% loss · request timed out",
    Unknown: "No monitoring baseline. Simulated probe result unavailable.",
  }[status];
}

export function topology(devices: Device[]) {
  // Exclude offline/down devices from the topology map
  const activeDevices = devices.filter((d) => d.status !== "Offline");
  const byDomain = new Map(activeDevices.map((d) => [d.domain, d]));
  
  function depth(d: Device, seen = new Set<string>()): number {
    if (seen.has(d.domain)) return 0;
    const p = byDomain.get(d.parent);
    return p ? Math.min(8, 1 + depth(p, new Set([...seen, d.domain]))) : 0;
  }

  const levels = new Map<number, Device[]>();
  activeDevices.forEach((d) => {
    const level = depth(d);
    levels.set(level, [...(levels.get(level) ?? []), d]);
  });

  const width = Math.max(
    960,
    ...[...levels.values()].map((v) => v.length * 240 + 60),
  );

  const nodes = [...levels].flatMap(([level, ds]) =>
    ds.map((d, i) => ({
      ...d,
      x: ((i + 1) * width) / (ds.length + 1),
      y: 65 + level * 155,
    })),
  );

  const positioned = new Map(nodes.map((d) => [d.domain, d]));

  return {
    nodes,
    width,
    height: Math.max(420, (Math.max(0, ...levels.keys()) + 1) * 155),
    edges: nodes.flatMap((d) => {
      const p = positioned.get(d.parent);
      return p
        ? [
            {
              id: d.id,
              x1: p.x,
              y1: p.y + 34,
              x2: d.x,
              y2: d.y - 34,
              status: d.status,
            },
          ]
        : [];
    }),
  };
}