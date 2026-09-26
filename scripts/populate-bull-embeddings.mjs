#!/usr/bin/env node
// Backfills bulls.embedding for ~300k rows by calling the generate-bull-embeddings
// edge function in a loop until remaining=0. Session-independent — meant to run via
// nohup on the Mac Mini so it survives the Claude Code session ending.
//
// Auth: mints a fresh access token for an admin user via the Supabase Auth Admin API
// (magic link generate + verify) using the service_role key. Never touches the user's
// real password. Refreshes the token whenever a call returns 401, or every ~50 min
// (access tokens are short-lived).
//
// Usage: SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... node populate-bull-embeddings.mjs

const PROJECT_URL = 'https://odactdxpecpiyiyaqfgi.supabase.co';
const ADMIN_EMAIL = 'dmarcondesguerra@gmail.com';
const BATCH_SIZE = 100;
const SLEEP_MS_BETWEEN_BATCHES = 1000;
const LOG_FILE = new URL('./populate-bull-embeddings.log', import.meta.url).pathname;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY env vars.');
  process.exit(1);
}

const fs = await import('node:fs');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function mintAccessToken() {
  const linkResp = await fetch(`${PROJECT_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email: ADMIN_EMAIL }),
  });
  if (!linkResp.ok) throw new Error(`generate_link failed: ${linkResp.status} ${await linkResp.text()}`);
  const linkData = await linkResp.json();

  const verifyResp = await fetch(`${PROJECT_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: linkData.hashed_token }),
  });
  if (!verifyResp.ok) throw new Error(`verify failed: ${verifyResp.status} ${await verifyResp.text()}`);
  const verifyData = await verifyResp.json();
  return verifyData.access_token;
}

async function callBatch(token) {
  const resp = await fetch(`${PROJECT_URL}/functions/v1/generate-bull-embeddings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch_size: BATCH_SIZE }),
  });
  return { status: resp.status, body: await resp.json() };
}

async function main() {
  log(`Starting bull embedding backfill (batch_size=${BATCH_SIZE})`);
  let token = await mintAccessToken();
  let tokenMintedAt = Date.now();
  let totalSucceeded = 0;
  let totalFailed = 0;
  let batchNum = 0;

  while (true) {
    batchNum++;
    if (Date.now() - tokenMintedAt > 45 * 60 * 1000) {
      token = await mintAccessToken();
      tokenMintedAt = Date.now();
      log('Refreshed access token (45min elapsed)');
    }

    let result;
    try {
      result = await callBatch(token);
    } catch (err) {
      log(`Batch ${batchNum} network error: ${err.message}. Retrying in 10s.`);
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    if (result.status === 401) {
      log('Got 401, refreshing token and retrying.');
      token = await mintAccessToken();
      tokenMintedAt = Date.now();
      continue;
    }
    if (result.status !== 200) {
      log(`Batch ${batchNum} unexpected status ${result.status}: ${JSON.stringify(result.body)}. Retrying in 10s.`);
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    const { processed, succeeded, failed, skipped, remaining, message } = result.body;
    totalSucceeded += succeeded ?? 0;
    totalFailed += failed ?? 0;
    log(`Batch ${batchNum}: processed=${processed} succeeded=${succeeded} failed=${failed} skipped=${skipped} remaining=${remaining} (cumulative: ${totalSucceeded} ok, ${totalFailed} failed)`);

    if (!remaining || remaining <= 0) {
      log(`Done. ${message}`);
      break;
    }
    await new Promise(r => setTimeout(r, SLEEP_MS_BETWEEN_BATCHES));
  }
}

main().catch(err => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
