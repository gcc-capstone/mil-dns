import test from "node:test";
import assert from "node:assert/strict";
import { initialState, importRows, topology, ping, addEvent } from "./model";
test("Import creates unknown devices without mutating original state", () => {
  const s = initialState();
  const next = importRows(s, [
    {
      name: "Test",
      domain: "TEST.example.test.",
      ipv4: "10.50.0.1",
      network: "Example",
      ipv6: "fd50::1",
    },
  ]);
  assert.equal(s.devices.length, 12);
  assert.equal(next.devices.length, 13);
  assert.equal(next.devices.at(-1)?.domain, "test.example.test");
  assert.equal(next.devices.at(-1)?.status, "Unknown");
  assert.equal(next.events.at(-1)?.title, "Device added");
});
test("Invalid second row rejects entire batch", () => {
  const s = initialState();
  assert.throws(
    () =>
      importRows(s, [
        {
          name: "Good",
          domain: "good.test",
          ipv4: "10.60.0.1",
          network: "New",
        },
        { name: "Bad", domain: "bad.test", ipv4: "999.1.1.1", network: "New" },
      ]),
    /Row 3/,
  );
  assert.equal(s.devices.length, 12);
  assert.equal(s.events.length, 4);
});
test("Duplicate domains and equivalent IPv6 addresses are rejected", () => {
  const s = initialState();
  assert.throws(
    () =>
      importRows(s, [
        {
          name: "Duplicate",
          domain: "GATEWAY-01.ALPHA.TEST",
          ipv4: "10.20.0.99",
          network: "Other",
        },
      ]),
    /Duplicate domain/,
  );
  assert.throws(
    () =>
      importRows(s, [
        {
          name: "Duplicate",
          domain: "new.test",
          ipv4: "10.20.0.99",
          ipv6: "fd20:0:0:0:0:0:0:1",
          network: "Base Alpha",
        },
      ]),
    /Duplicate address/,
  );
});
test("Topology connects east sector children to the failed router", () => {
  const map = topology(
    initialState().devices.filter((d) => d.network === "Base Alpha"),
  );
  assert.equal(map.nodes.length, 8);
  assert.equal(map.edges.length, 7);
  const parent = map.nodes.find((d) => d.id === 5)!;
  const edge = map.edges.find((d) => d.id === 6)!;
  assert.equal(edge.x1, parent.x);
  assert.equal(edge.y1, parent.y + 34);
  assert.equal(edge.status, "Down");
});
test("Ping and audit records are deterministic demo behavior", () => {
  assert.match(ping("Down"), /100% loss/);
  const s = initialState();
  const next = addEvent(s, 4, "Simulated ping · Matt", ping("Down"));
  assert.equal(next.events.length, s.events.length + 1);
  assert.equal(next.devices[3].status, "Down");
});
