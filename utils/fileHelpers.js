/* eslint-env node */
/* global require, exports, __dirname, process, module */

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..");

function readJsonFile(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeJsonFile(filename, data) {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
