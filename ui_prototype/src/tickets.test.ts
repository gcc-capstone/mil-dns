import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  openTicket,
  finishTicket,
  migrateState,
  DEMO_USERS,
  type TicketInput,
} from "./model";
const problem: TicketInput = {
  title: "Cannot reach arriving laptop",
  description: "DNS lookup fails after joining the network.",
  type: "Problem",
  priority: "High",
  deviceId: 1,
  network: "Unclassified",
};
const registration: TicketInput = {
  ...problem,
  title: "Register arriving laptop",
  type: "Device registration",
  deviceId: null,
  registration: {
    name: "Laptop",
    domain: "new.field.test",
    ipv4: "10.20.0.99",
    engineers: "Veronica",
  },
};
test("Opening a ticket records ownership, audit, and online ticket status", () => {
  const s = initialState();
  const next = openTicket(s, DEMO_USERS.user, problem);
  assert.equal(next.alerts.at(-1)?.createdBy, "Veronica");
  assert.equal(next.devices[0].status, "Online-Open-Ticket");
  assert.equal(s.devices[0].status, "Online");
  assert.match(next.events.at(-1)!.title, /Veronica/);
});
test("Admin-only close requires a resolution and retains offline state", () => {
  let s = openTicket(initialState(), DEMO_USERS.user, {
    ...problem,
    deviceId: 4,
  });
  const id = s.alerts.at(-1)!.id;
  assert.throws(
    () => finishTicket(s, DEMO_USERS.user, id, "fixed"),
    /Only an admin/,
  );
  assert.throws(
    () => finishTicket(s, DEMO_USERS.admin, id, "  "),
    /resolution/,
  );
  s = finishTicket(
    s,
    DEMO_USERS.admin,
    id,
    "Device intentionally disconnected.",
  );
  assert.equal(s.devices[3].status, "Offline");
  assert.equal(s.alerts.at(-1)?.closedBy, "Matt");
  assert.equal(s.alerts.at(-1)?.resolved, true);
  assert.throws(
    () => finishTicket(s, DEMO_USERS.admin, id, "again"),
    /already closed/,
  );
});
test("Multiple tickets keep online marker until the last one closes", () => {
  let s = openTicket(initialState(), DEMO_USERS.user, problem);
  const first = s.alerts.at(-1)!.id;
  s = openTicket(s, DEMO_USERS.user, problem);
  const second = s.alerts.at(-1)!.id;
  s = finishTicket(s, DEMO_USERS.admin, first, "Resolved");
  assert.equal(s.devices[0].status, "Online-Open-Ticket");
  s = finishTicket(s, DEMO_USERS.admin, second, "Resolved");
  assert.equal(s.devices[0].status, "Online");
});
test("Registration approval applies admin corrections and adds exactly one device", () => {
  const original = initialState();
  let s = openTicket(original, DEMO_USERS.user, registration);
  const t = s.alerts.at(-1)!;
  assert.equal(s.devices.length, original.devices.length);
  s = finishTicket(
    s,
    DEMO_USERS.admin,
    t.id,
    "Corrected assignment and approved.",
    true,
    { ...t.registration, engineers: "James" },
  );
  assert.equal(s.devices.length, original.devices.length + 1);
  assert.equal(s.devices.at(-1)?.engineers, "James");
  assert.equal(s.devices.at(-1)?.status, "Unknown");
  assert.equal(s.alerts.at(-1)?.deviceId, s.devices.at(-1)?.id);
  assert.throws(
    () => finishTicket(s, DEMO_USERS.admin, t.id, "Again", true),
    /already closed/,
  );
});
test("Registration collision at approval remains open and adds nothing", () => {
  let s = openTicket(initialState(), DEMO_USERS.user, registration);
  const t = s.alerts.at(-1)!;
  assert.throws(
    () =>
      finishTicket(s, DEMO_USERS.admin, t.id, "Approve", true, {
        ...t.registration,
        domain: s.devices[0].domain,
      }),
    /Duplicate/,
  );
  assert.equal(s.alerts.at(-1)?.resolved, false);
  const closed = finishTicket(
    s,
    DEMO_USERS.admin,
    t.id,
    "Duplicate arrival; not added.",
  );
  assert.equal(closed.devices.length, s.devices.length);
});
test("Version 2 migration retains inventory and original ticket data", () => {
  const source = initialState();
  const t = source.alerts[0];
  const old = {
    ...source,
    version: 2,
    alerts: [
      {
        id: t.id,
        deviceId: t.deviceId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        resolved: false,
      },
    ],
  };
  const next = migrateState(old);
  assert.equal(next.version, 3);
  assert.equal(next.devices.length, source.devices.length);
  assert.equal(next.alerts[0].title, t.title);
  assert.equal(next.alerts[0].createdAt, "Not recorded");
  assert.equal(next.alerts[0].history.length, 1);
});
test("Whitespace, missing network and mismatched device are rejected", () => {
  const s = initialState();
  assert.throws(
    () => openTicket(s, DEMO_USERS.user, { ...problem, title: " " }),
    /title/,
  );
  assert.throws(
    () => openTicket(s, DEMO_USERS.user, { ...problem, network: "" }),
    /network/,
  );
  assert.throws(
    () => openTicket(s, DEMO_USERS.user, { ...problem, network: "Secret" }),
    /chosen network/,
  );
});
