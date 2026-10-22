import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

test("User opens ticket, admin closes, and role controls survive refresh", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "http://localhost/#/",
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    location: dom.window.location,
    history: dom.window.history,
    localStorage: dom.window.localStorage,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  dom.window.scrollTo = () => {};
  let root = createRoot(document.getElementById("root")!);
  const navigate = async (hash: string) => {
    await act(async () => {
      history.replaceState(null, "", hash);
      window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
  };
  const switchRole = async (role: string) => {
    await act(async () => {
      const select = document.querySelector(
        '[aria-label="Demo user"]',
      ) as HTMLSelectElement;
      select.value = role;
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };
  const fill = (name: string, value: string) => {
    const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
    assert.ok(el, name);
    el.value = value;
  };
  const click = async (text: string) => {
    const b = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === text,
    );
    assert.ok(b, text);
    await act(async () => {
      b.click();
      await new Promise((r) => setTimeout(r, 10));
    });
  };
  const saved = () => JSON.parse(localStorage.getItem("fdns-react-demo-v3")!);
  await act(async () => root.render(<App />));
  await switchRole("user");
  await navigate("#/import");
  assert.ok(document.querySelector('input[type="file"]'));
  assert.match(document.body.textContent!, /Export device inventory/);
  assert.ok(
    [...document.querySelectorAll("nav a")].some((a) =>
      a.textContent?.includes("Upload & export"),
    ),
  );
  await navigate("#/devices/add");
  assert.match(document.body.textContent!, /Admin action/);
  await navigate("#/tickets/new?device=4");
  fill("title", "Unable to resolve device");
  fill("description", "Device arrived; lookup fails.");
  await click("Submit ticket");
  const ticket = saved().alerts.at(-1);
  assert.equal(ticket.createdBy, "Veronica");
  assert.equal(ticket.deviceId, 4);
  assert.equal(
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Close ticket",
    ),
    false,
  );
  await switchRole("admin");
  fill("resolution", "Device is disconnected intentionally.");
  await click("Close ticket");
  assert.equal(saved().alerts.at(-1).resolved, true);
  assert.equal(
    saved().devices.find((d: { id: number }) => d.id === 4).status,
    "Offline",
  );
  await switchRole("user");
  await navigate("#/tickets/new?type=registration");
  fill("title", "Register mobile terminal");
  fill("description", "New arrival needs a local DNS record.");
  fill("name", "Mobile terminal");
  fill("domain", "mobile.field.test");
  fill("ipv4", "10.20.0.80");
  await click("Submit ticket");
  const count = saved().devices.length;
  await switchRole("admin");
  fill("engineers", "James");
  fill("resolution", "Corrected engineer and approved.");
  await click("Approve & add device");
  assert.equal(saved().devices.length, count + 1);
  assert.equal(saved().devices.at(-1).engineers, "James");
  assert.equal(saved().alerts.at(-1).resolved, true);
  await switchRole("user");
  await navigate("#/tickets");
  await act(async () => root.unmount());
  root = createRoot(document.getElementById("root")!);
  await act(async () => root.render(<App />));
  assert.equal(
    (document.querySelector('[aria-label="Demo user"]') as HTMLSelectElement)
      .value,
    "user",
  );
  assert.equal(saved().alerts.at(-1).resolved, true);
  await navigate("#/devices/1?tab=metadata");
  assert.equal(
    [...document.querySelectorAll("button")].some((b) =>
      b.textContent?.includes("Mark online"),
    ),
    false,
  );
  await act(async () => root.unmount());
  dom.window.close();
});
