/**
 * Performance testing scenario example
 *
 * Demonstrates:
 * - Response time validation
 * - Concurrent requests
 * - Load testing patterns
 * - Performance metrics collection
 *
 * Run with:
 *   probitas run example/scenarios/performance.scenario.ts
 */

import { client, expect, scenario } from "probitas";

await using api = client.http("https://httpbin.org");

const performanceScenario = scenario("Performance Testing", {
  tags: ["performance", "load", "example"],
})
  .step("Measure Response Time", async () => {
    const result = await api.get("/get");

    expect(result.status).toBe(200);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.duration).toBeLessThan(5000); // Less than 5 seconds

    return result.duration;
  })
  .step("Fast Endpoint Validation", async () => {
    const result = await api.get("/uuid");

    expect(result.status).toBe(200);
    // UUID endpoint should be very fast
    expect(result.duration).toBeLessThan(2000);
  })
  .step("Slow Endpoint with Delay", async () => {
    const result = await api.get("/delay/2");

    expect(result.status).toBe(200);
    // Should take at least 2 seconds
    expect(result.duration).toBeGreaterThan(2000);
    expect(result.duration).toBeLessThan(4000);
  }, {
    timeout: 10000, // Increase timeout for this slow step
  })
  .step("Concurrent Requests", async () => {
    const startTime = Date.now();

    // Send 10 requests in parallel
    const requests = Array.from(
      { length: 10 },
      (_, i) => api.get(`/anything/${i}`),
    );

    const results = await Promise.all(requests);

    const totalTime = Date.now() - startTime;

    // Verify all succeeded
    results.forEach((result, i) => {
      expect(result.status).toBe(200);
      expect(result.json.url).toContain(`/${i}`);
    });

    // Calculate average response time
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) /
      results.length;

    // Parallel requests should be faster than sequential
    expect(totalTime).toBeLessThan(avgDuration * 10);

    return {
      totalTime,
      avgDuration,
      maxDuration: Math.max(...results.map((r) => r.duration)),
      minDuration: Math.min(...results.map((r) => r.duration)),
    };
  })
  .step("Validate Performance Metrics", (ctx) => {
    const metrics = ctx.previous;

    expect(metrics.avgDuration).toBeGreaterThan(0);
    expect(metrics.maxDuration).toBeGreaterThanOrEqual(metrics.avgDuration);
    expect(metrics.minDuration).toBeLessThanOrEqual(metrics.avgDuration);

    // Log performance summary
    console.log("Performance Metrics:");
    console.log(`  Total Time: ${metrics.totalTime}ms`);
    console.log(`  Average: ${metrics.avgDuration.toFixed(2)}ms`);
    console.log(`  Min: ${metrics.minDuration}ms`);
    console.log(`  Max: ${metrics.maxDuration}ms`);
  })
  .step("Sequential vs Parallel Comparison", async () => {
    // Sequential requests
    const seqStart = Date.now();
    for (let i = 0; i < 5; i++) {
      await api.get("/uuid");
    }
    const seqTime = Date.now() - seqStart;

    // Parallel requests
    const parStart = Date.now();
    await Promise.all(
      Array.from({ length: 5 }, () => api.get("/uuid")),
    );
    const parTime = Date.now() - parStart;

    // Note: Parallel requests are not always faster due to:
    // - Network congestion
    // - HTTP connection limits
    // - Server-side rate limiting
    // So we just log the comparison without strict assertion
    console.log(`Sequential: ${seqTime}ms, Parallel: ${parTime}ms`);

    return {
      sequential: seqTime,
      parallel: parTime,
      improvement: parTime < seqTime
        ? ((seqTime - parTime) / seqTime * 100).toFixed(2) + "%"
        : `-${((parTime - seqTime) / seqTime * 100).toFixed(2)}%`,
    };
  })
  .build();

export default performanceScenario;
