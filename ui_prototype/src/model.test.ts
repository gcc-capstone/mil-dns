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
  assert.equal(s.devices.length, 14);
  assert.equal(next.devices.length, 15);
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
  assert.equal(s.devices.length, 14);
  assert.equal(s.events.length, 4);
});
test("Duplicate domains and equivalent IPv6 addresses are rejected", () => {
  const s = initialState();
  assert.throws(
    () =>
      importRows(s, [
        {
          name: "Duplicate",
          domain: "GATEWAY-01.UNCLASS.TEST",
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
          network: "Unclassified",
        },
      ]),
    /Duplicate address/,
  );
});
test("Topology preserves the uploaded UI's exclusion of offline devices", () => {
  const devices = initialState().devices.filter(
    (d) => d.network === "Unclassified",
  );
  const map = topology(devices);
  assert.equal(map.nodes.length, 4);
  assert.equal(map.edges.length, 3);
  assert.ok(map.nodes.every((d) => d.status !== "Offline"));
});
test("Ping and audit records are deterministic demo behavior", () => {
  assert.match(ping("Offline"), /100% loss/);
  const s = initialState();
  const next = addEvent(s, 4, "Simulated ping · Matt", ping("Offline"));
  assert.equal(next.events.length, s.events.length + 1);
  assert.equal(next.devices[3].status, "Offline");
});
