/**
 * Runs the PostBridge stand-in as a server until stopped, so the shop can be
 * pointed at it instead of the real account:
 *
 *   npx tsx scripts/postbridge/mock-server.ts          # http://127.0.0.1:4010
 *   npx tsx scripts/postbridge/mock-server.ts 4020 --flat
 *
 * then, for the shop's dev server:
 *   POSTBRIDGE_BASE_URL=http://127.0.0.1:4010/api/v1
 *   POSTBRIDGE_API_KEY=pb_mock_0000
 *   POSTBRIDGE_ENABLED=true
 *
 * While it runs: GET /__control/state shows what it holds, and
 * POST /__control/fault {"fault":"create"|"book"|"cancel"|"tracking"|"label"|null}
 * makes one call fail on purpose. See mock.ts for what it does and does not stand for.
 */

import { startMock } from "./mock";

async function main() {
  const port = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 4010);
  const mock = await startMock({ shape: process.argv.includes("--flat") ? "flat" : "wrapped", port });
  console.log(`PostBridge stand-in listening at ${mock.url}   key: ${mock.key}`);
  console.log("This is NOT the real PostBridge. Press Ctrl+C to stop.");
}

main();
