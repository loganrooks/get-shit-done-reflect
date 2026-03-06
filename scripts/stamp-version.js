#!/usr/bin/env node
/**
 * Stamp the current package.json version into config.json template.
 *
 * Keeps get-shit-done/templates/config.json in sync with the package version
 * so that new installs always get the correct gsd_reflect_version.
 *
 * Wired into prepublishOnly and the release workflow.
 */

const fs = require('fs');
const path = require('path');

const PKG_PATH = path.join(__dirname, '..', 'package.json');
const CONFIG_PATH = path.join(__dirname, '..', 'get-shit-done', 'templates', 'config.json');

const pkg = require(PKG_PATH);
const version = pkg.version;

const configRaw = fs.readFileSync(CONFIG_PATH, 'utf8');
const config = JSON.parse(configRaw);

const oldVersion = config.gsd_reflect_version;

if (oldVersion === version) {
  console.log(`gsd_reflect_version already up to date: ${version}`);
} else {
  config.gsd_reflect_version = version;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  console.log(`Stamped gsd_reflect_version: ${oldVersion} -> ${version}`);
}
