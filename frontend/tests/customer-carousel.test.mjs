import assert from "node:assert/strict";
import test from "node:test";
import { cycleIndex, filterByCategory, visibleWindow } from "../src/lib/customer-carousel.ts";

test("cycleIndex wraps carousel navigation in both directions", () => {
  assert.equal(cycleIndex(0, -1, 3), 2);
  assert.equal(cycleIndex(2, 1, 3), 0);
  assert.equal(cycleIndex(0, 1, 0), 0);
});

test("visibleWindow returns the requested circular card count", () => {
  assert.deepEqual(visibleWindow(["a", "b", "c"], 2, 2), ["c", "a"]);
  assert.deepEqual(visibleWindow(["a", "b"], 1, 4), ["b", "a"]);
});

test("filterByCategory preserves all plans or returns the matching category", () => {
  const plans = [{ category: "VPS" }, { category: "SSL" }];
  assert.deepEqual(filterByCategory(plans, "all"), plans);
  assert.deepEqual(filterByCategory(plans, "SSL"), [{ category: "SSL" }]);
});

test("filterByCategory groups API category names under public service filters", () => {
  const plans = [
    { category: "QA Cloud VPS", name: "QA Cloud VPS" },
    { category: "VPS Demo 15c2ca8d", name: "VPS Basic" },
    { category: "QA Cloud Hosting", name: "QA Hosting Starter" },
    { category: "QA Email Business", name: "QA Email Basic" },
    { category: "Core Services", name: "SSL Standard" },
  ];

  assert.deepEqual(filterByCategory(plans, "VPS"), [plans[0], plans[1]]);
  assert.deepEqual(filterByCategory(plans, "Hosting"), [plans[2]]);
  assert.deepEqual(filterByCategory(plans, "Cloud"), [plans[0], plans[2]]);
  assert.deepEqual(filterByCategory(plans, "Email"), [plans[3]]);
  assert.deepEqual(filterByCategory(plans, "SSL"), [plans[4]]);
});
