import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

test("React navigation, metadata actions, acknowledgement, and persistence", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "http://localhost/#/",
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    location: dom.window.location,
    history: dom.window.history,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  dom.window.scrollTo = () => {};
  const root = createRoot(document.getElementById("root")!);
  const navigate = async (hash: string) => {
    await act(async () => {
      history.replaceState(null, "", hash);
      window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
  };
  const click = async (text: string) => {
    const button = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    );
    assert.ok(button, `Missing ${text}`);
    await act(async () => button.click());
  };
  await act(async () => root.render(<App />));
  assert.match(document.body.textContent!, /Operations overview/);
  await click("Acknowledge");
  assert.equal(
    JSON.parse(localStorage.getItem("fdns-react-demo-v1")!).alerts[0]
      .acknowledged,
    true,
  );
  await navigate("#/devices?network=Forward%20Operations");
  assert.match(
    document.querySelector("table")!.textContent!,
    /Forward gateway/,
  );
  assert.doesNotMatch(
    document.querySelector("table")!.textContent!,
    /Operations server/,
  );
  await navigate("#/devices/4");
  await click("Run simulated ping");
  assert.match(
    document.getElementById("metadata-panel")!.textContent!,
    /100% loss/,
  );
  await click("Notify engineers");
  assert.match(
    document.getElementById("metadata-panel")!.textContent!,
    /No external message was sent/,
  );
  await click("Mark online");
  const saved = JSON.parse(localStorage.getItem("fdns-react-demo-v1")!);
  assert.equal(
    saved.devices.find((d: { id: number }) => d.id === 4).status,
    "Online",
  );
  await navigate("#/topology");
  assert.equal(document.querySelectorAll("svg a").length, 8);
  await act(async () => root.unmount());
  dom.window.close();
});
