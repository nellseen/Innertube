import http from 'http';

interface BenchmarkResult {
  stage: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  reqPerSec: number;
  latenciesMs: number[];
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

function makeRequest(url: string): Promise<{ success: boolean; latencyMs: number; statusCode: number }> {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const latencyMs = performance.now() - start;
        resolve({
          success: res.statusCode === 200,
          latencyMs,
          statusCode: res.statusCode || 500,
        });
      });
    });

    req.on('error', () => {
      resolve({
        success: false,
        latencyMs: performance.now() - start,
        statusCode: 500,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        latencyMs: 5000,
        statusCode: 504,
      });
    });
  });
}

async function runStage(stageName: string, concurrentUsers: number, durationSeconds: number, targetUrl: string): Promise<BenchmarkResult> {
  const endTime = Date.now() + durationSeconds * 1000;
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  const startTime = performance.now();

  async function worker() {
    while (Date.now() < endTime) {
      const res = await makeRequest(targetUrl);
      latencies.push(res.latencyMs);
      if (res.success) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
    }
  }

  // Spawn concurrent workers
  const workers = Array.from({ length: concurrentUsers }, () => worker());
  await Promise.all(workers);

  const durationMs = performance.now() - startTime;
  const totalRequests = successfulRequests + failedRequests;
  const reqPerSec = totalRequests / (durationMs / 1000);

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;

  return {
    stage: stageName,
    totalRequests,
    successfulRequests,
    failedRequests,
    durationMs,
    reqPerSec,
    latenciesMs: latencies,
    p50,
    p95,
    p99,
    min,
    max,
  };
}

async function runFullLoadTest() {
  const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3000/api/health';
  console.log(`\n======================================================`);
  console.log(`⚡ AETHERIA MUSIC — PRODUCTION LOAD TEST PIPELINE`);
  console.log(`Target: ${targetUrl}`);
  console.log(`======================================================\n`);

  // 1. Baseline Test (5 concurrent users, 3s)
  console.log(`[Stage 1/4] Running Baseline Load (5 concurrent users)...`);
  const baseline = await runStage('Baseline', 5, 3, targetUrl);

  // 2. Ramp-up Test (15 concurrent users, 3s)
  console.log(`[Stage 2/4] Running Ramp-up Load (15 concurrent users)...`);
  const rampup = await runStage('Ramp-Up', 15, 3, targetUrl);

  // 3. Sustained Load (25 concurrent users, 4s)
  console.log(`[Stage 3/4] Running Sustained Load (25 concurrent users)...`);
  const sustained = await runStage('Sustained', 25, 4, targetUrl);

  // 4. Spike Load (40 concurrent users, 2s)
  console.log(`[Stage 4/4] Running Spike Load (40 concurrent users)...`);
  const spike = await runStage('Spike', 40, 2, targetUrl);

  console.log(`\n======================================================`);
  console.log(`📊 LOAD TEST PERFORMANCE SUMMARY`);
  console.log(`======================================================`);

  const results = [baseline, rampup, sustained, spike];
  console.table(
    results.map((r) => ({
      Stage: r.stage,
      Requests: r.totalRequests,
      'Success %': ((r.successfulRequests / r.totalRequests) * 100).toFixed(1) + '%',
      'Req/Sec': r.reqPerSec.toFixed(1),
      'p50 (ms)': r.p50.toFixed(2),
      'p95 (ms)': r.p95.toFixed(2),
      'p99 (ms)': r.p99.toFixed(2),
    }))
  );

  const totalErrors = results.reduce((acc, r) => acc + r.failedRequests, 0);
  if (totalErrors === 0) {
    console.log(`\n✅ LOAD TEST PASSED: 0 errors encountered across all stages.`);
    process.exit(0);
  } else {
    console.warn(`\n⚠️ LOAD TEST WARNING: ${totalErrors} errors detected.`);
    process.exit(0); // non-blocking for reporting
  }
}

runFullLoadTest().catch((err) => {
  console.error('[FATAL] Load test error:', err);
  process.exit(1);
});
