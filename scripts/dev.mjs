// Start the preview as one supervised unit, so its login API is not forgotten.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    try {
      if (process.platform === 'win32') child.kill('SIGTERM');
      else process.kill(-child.pid, 'SIGTERM');
    } catch { /* Child already stopped. */ }
  }
  const timer = setTimeout(() => {
    for (const child of children) {
      try {
        if (process.platform === 'win32') child.kill('SIGKILL');
        else process.kill(-child.pid, 'SIGKILL');
      } catch { /* Child already stopped. */ }
    }
  }, 3000);
  timer.unref();
}
function launch(file, args, service = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(file, import.meta.url)), ...args], {
      cwd: root, stdio: 'inherit', detached: process.platform !== 'win32',
    });
    children.add(child);
    child.once('error', error => { children.delete(child); reject(error); if (service) stop(1); });
    child.once('exit', code => {
      children.delete(child);
      if (service && !stopping) {
        console.error('A preview service stopped; shutting down its companion.');
        stop(code || 1);
      }
      if (code === 0 || stopping) resolve();
      else reject(new Error(`Preview process exited with code ${code}.`));
    });
  });
}
async function assertPortAvailable(port) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is already in use. Stop the existing preview before starting another.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}
async function waitForReady() {
  const deadline = Date.now() + 30_000;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:5173/api/ready', { signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).service === 'G WORLD account service') return;
    } catch { /* API or frontend still starting. */ }
    await delay(300);
  }
  if (!stopping) throw new Error('Preview account service did not become ready within 30 seconds. Check the API and local database logs.');
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
try {
  await assertPortAvailable(5173);
  await assertPortAvailable(8787);
  // Idempotent schema initialization; never touches remote D1 or creates users.
  await launch('../node_modules/wrangler/bin/wrangler.js', ['d1', 'execute', 'g-world', '--local', '--config', 'worker/wrangler.toml', '--file=schema/schema.sql']);
  if (!stopping) {
    console.log('\nStarting G WORLD frontend (5173) and local API (8787).\n');
    const services = Promise.all([
      launch('../node_modules/vite/bin/vite.js', ['--host', '0.0.0.0', '--strictPort'], true),
      launch('../node_modules/wrangler/bin/wrangler.js', ['dev', '--config', 'worker/wrangler.toml', '--ip', '0.0.0.0', '--port', '8787'], true),
    ]);
    await Promise.race([waitForReady(), services]);
    if (!stopping) console.log('G WORLD ready: frontend, API and account database checks passed.');
    await services;
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
