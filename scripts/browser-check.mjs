// Revisión del navegador real, sin interceptar ni simular respuestas HTTP.
// Node 22 y Google Chrome instalado. No usa dependencias adicionales.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const origin = process.env.FRONTEND_URL || 'http://localhost:4200';
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = path.resolve('artifacts/phase6');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), 'iecm-browser-check-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
const report = { generatedAt: new Date().toISOString(), origin, mockedResponses: false, checks: [], consoleErrors: [], networkErrors: [] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome no inició en 15 segundos.')), 15000);
    chrome.once('error', reject); chrome.once('exit', code => reject(new Error(`Chrome terminó: ${code}`)));
    chrome.stderr.on('data', chunk => { const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
  });
  socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const requests = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiting = pending.get(message.id);
      if (waiting) { clearTimeout(waiting.timer); pending.delete(message.id); message.error ? waiting.reject(new Error(message.error.message)) : waiting.resolve(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') report.consoleErrors.push(message.params.exceptionDetails.text);
    else if (message.method === 'Network.requestWillBeSent') requests.set(message.params.requestId, message.params.request.url);
    else if (message.method === 'Network.loadingFailed') report.networkErrors.push({ url: requests.get(message.params.requestId), error: message.params.errorText });
  });
  function call(method, params = {}, sessionId) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout CDP: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params = {}) => call(method, params, sessionId);
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  async function evaluate(expression) {
    const value = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
    return value.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 50; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`No se cumplió la condición: ${expression}`);
  }
  async function screenshot(name) {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(output, name), Buffer.from(data, 'base64'));
  }
  function check(name, passed, details) { report.checks.push({ name, passed: Boolean(passed), ...(details === undefined ? {} : { details }) }); }
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `${origin}/dashboard` });
  await waitFor(`document.querySelector('app-monitor-filters') !== null`);
  await pause(1500);
  check('desktop-title', await evaluate(`document.querySelector('main h1')?.textContent.includes('Monitor de avance')`));
  check('desktop-no-overflow', await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  check('one-main-landmark', await evaluate(`document.querySelectorAll('main').length === 1`));
  check('inputs-have-labels', await evaluate(`[...document.querySelectorAll('input, select')].every(e => e.labels?.length || e.getAttribute('aria-label'))`));
  const api = await evaluate(`fetch('/api/health').then(async r => ({status:r.status, contentType:r.headers.get('content-type'), body:(await r.text()).slice(0,300)})).catch(() => ({status:0}))`);
  report.api = api;
  check('sql-api-ready', api.status === 200 && api.contentType?.includes('application/json'), api);
  const backendAvailable = report.checks.at(-1).passed;
  if (!backendAvailable) {
    await waitFor(`document.querySelector('app-error-state') !== null`);
    check('unavailable-api-visible-error', await evaluate(`document.querySelector('app-error-state [role=alert]') !== null`));
    check('unavailable-api-no-fake-metrics', await evaluate(`document.querySelectorAll('app-metric-card').length === 0`));
  }
  await screenshot(backendAvailable ? 'dashboard-desktop.png' : 'dashboard-desktop-api-unavailable.png');
  await evaluate(`document.querySelector('nav a[href="/actas"]').click()`);
  await waitFor(`document.querySelector('app-actas-page') !== null`); await pause(1000);
  check('actas-active-navigation', await evaluate(`document.querySelector('nav a[aria-current=page]')?.getAttribute('href') === '/actas'`));
  check('actas-no-overflow', await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  await screenshot(backendAvailable ? 'actas-desktop.png' : 'actas-desktop-api-unavailable.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('nav a[href="/dashboard"]').click()`);
  await waitFor(`document.querySelector('app-dashboard-page') !== null`); await pause(1000);
  check('mobile-no-overflow', await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  check('mobile-menu-initially-hidden', await evaluate(`getComputedStyle(document.querySelector('aside')).display === 'none'`));
  await evaluate(`document.querySelector('button[aria-controls="institutional-sidebar"]').click()`); await pause(150);
  check('mobile-menu-opens', await evaluate(`getComputedStyle(document.querySelector('aside')).display !== 'none' && document.querySelector('button[aria-controls]').getAttribute('aria-expanded') === 'true'`));
  await screenshot('mobile-menu.png');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await pause(150);
  check('escape-closes-menu', await evaluate(`getComputedStyle(document.querySelector('aside')).display === 'none'`));
  check('escape-restores-focus', await evaluate(`document.activeElement === document.querySelector('button[aria-controls]')`));
  await screenshot(backendAvailable ? 'dashboard-mobile.png' : 'dashboard-mobile-api-unavailable.png');
  await cdp('Page.navigate', { url: `${origin}/ruta-inexistente` }); await waitFor(`document.querySelector('app-not-found-page') !== null`);
  check('unknown-route', await evaluate(`document.querySelector('main h1').textContent.includes('Página no encontrada')`));
  report.summary = { passed: report.checks.filter(c => c.passed).length, failed: report.checks.filter(c => !c.passed).length };
  report.limitations = backendAvailable ? ['La revisión visual no certifica por sí sola WCAG ni valida el contenido de archivos descargados.'] : ['SQL/API no disponibles: no se validaron gráficas con datos, paginación real ni descargas. Las capturas reflejan la indisponibilidad real.'];
  await writeFile(path.join(output, 'browser-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.checks.some(c => !c.passed && c.name !== 'sql-api-ready')) process.exitCode = 1;
  await call('Browser.close').catch(() => undefined);
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  socket?.close(); chrome.kill();
  await pause(500); await rm(profile, { recursive: true, force: true });
}
