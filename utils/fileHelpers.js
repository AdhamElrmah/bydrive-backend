/* eslint-env node */
/* global require, exports, __dirname, process, module */

const { getStore } = require("@netlify/blobs");

// Seed data loaded from bundled JSON files (resolved at bundle time by esbuild)
let seedCars, seedUsers, seedRentals;
try { seedCars = require("../cars.json"); } catch { seedCars = []; }
try { seedUsers = require("../users.json"); } catch { seedUsers = []; }
try { seedRentals = require("../rentItem.json"); } catch { seedRentals = []; }

const SEED_MAP = {
  "cars.json": seedCars,
  "users.json": seedUsers,
  "rentItem.json": seedRentals,
};

function getAppStore() {
  return getStore({ name: "app-data", consistency: "strong" });
}

async function readJsonFile(filename) {
  try {
    const store = getAppStore();
    const data = await store.get(filename, { type: "json" });
    if (data !== null) return data;
  } catch (e) {
    console.error("Blobs read error:", e.message);
  }

  // First access: seed from bundled JSON data
  const initial = SEED_MAP[filename] || [];
  try {
    const store = getAppStore();
    await store.setJSON(filename, initial);
  } catch (e) {
    console.error("Blobs seed error:", e.message);
  }
  return Array.isArray(initial) ? initial : [];
}

async function writeJsonFile(filename, data) {
  const store = getAppStore();
  await store.setJSON(filename, data);
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
