import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const port = 4317;
const origin = `http://127.0.0.1:${port}`;
const baseUrl = origin;
const { Pool } = pg;

test('StudioFlow keeps salon accounts and records isolated', { skip: !enabled }, async (t) => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let server;
  let studioA;
  let studioB;

  try {
    const schema = await readFile(new URL('./schema.postgres.sql', import.meta.url), 'utf8');
    await pool.query(schema);
    await pool.query('TRUNCATE user_sessions');
    server = spawn(process.execPath, ['server/index.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        SESSION_SECRET: 'integration-test-session-secret-at-least-32-characters',
        APP_ORIGIN: origin,
        PORT: String(port),
        NODE_ENV: 'test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverOutput = '';
    server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
    server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

    let healthy = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (server.exitCode !== null) throw new Error(`API server exited early: ${serverOutput}`);
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) { healthy = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.equal(healthy, true, `API server did not become healthy: ${serverOutput}`);

    async function register(studioName, email) {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: JSON.stringify({
          studioName,
          ownerName: 'Test Owner',
          email,
          password: 'correct-horse-battery',
        }),
      });
      const data = await response.json();
      assert.equal(response.status, 201, JSON.stringify(data));
      const cookie = response.headers.get('set-cookie')?.match(/studioflow\.sid=[^;]+/)?.[0];
      assert.ok(cookie, 'registration should issue a session cookie');
      return { ...data, cookie };
    }

    studioA = await register('Studio Alpha', 'alpha@example.test');
    studioB = await register('Studio Beta', 'beta@example.test');

    const bookingResponse = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        Cookie: studioA.cookie,
      },
      body: JSON.stringify({
        name: 'Client Alpha',
        email: 'client@example.test',
        service: 'Haircut',
        startsAt: '2030-06-01T10:00',
        durationMinutes: 60,
        amount: 1500,
      }),
    });
    const booking = await bookingResponse.json();
    assert.equal(bookingResponse.status, 201, JSON.stringify(booking));

    await t.test('rejects an overlapping confirmed appointment in the same studio', async () => {
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          Cookie: studioA.cookie,
        },
        body: JSON.stringify({
          name: 'Another Client',
          email: 'another@example.test',
          service: 'Color',
          startsAt: '2030-06-01T10:30',
          durationMinutes: 60,
          amount: 2000,
        }),
      });
      assert.equal(response.status, 409);
    });

    await t.test('does not expose one studio records to another studio', async () => {
      const response = await fetch(`${baseUrl}/api/appointments`, {
        headers: { Cookie: studioB.cookie },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), []);

      const crossStudioUpdate = await fetch(`${baseUrl}/api/appointments/${booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          Cookie: studioB.cookie,
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      assert.equal(crossStudioUpdate.status, 404);
    });

    await t.test('requires authentication for customer records and expires access after logout', async () => {
      const noSession = await fetch(`${baseUrl}/api/customers`);
      assert.equal(noSession.status, 401);

      const logout = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Origin: origin, Cookie: studioA.cookie },
      });
      assert.equal(logout.status, 204);

      const afterLogout = await fetch(`${baseUrl}/api/appointments`, {
        headers: { Cookie: studioA.cookie },
      });
      assert.equal(afterLogout.status, 401);
    });

    await t.test('rejects malformed appointment dates', async () => {
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          Cookie: studioB.cookie,
        },
        body: JSON.stringify({
          name: 'Bad Date',
          email: 'bad-date@example.test',
          service: 'Haircut',
          startsAt: '2026-02-29T10:00',
          durationMinutes: 60,
          amount: 500,
        }),
      });
      assert.equal(response.status, 400);
    });
  } finally {
    if (studioA?.studio?.id) await pool.query('DELETE FROM studios WHERE id = $1', [studioA.studio.id]).catch(() => {});
    if (studioB?.studio?.id) await pool.query('DELETE FROM studios WHERE id = $1', [studioB.studio.id]).catch(() => {});
    await pool.query('TRUNCATE user_sessions').catch(() => {});
    if (server && server.exitCode === null) {
      server.kill('SIGTERM');
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 3000);
        server.once('exit', () => { clearTimeout(timeout); resolve(); });
      });
    }
    await pool.end();
  }
});
