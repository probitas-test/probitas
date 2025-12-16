/**
 * Test utilities for mixin tests
 *
 * @module
 */

import { assertSnapshot } from "@std/testing/snapshot";
import { removeColors } from "@probitas/core/theme";

/**
 * Assert snapshot after removing ANSI color codes from the actual value.
 *
 * This ensures consistent snapshot comparisons across environments
 * regardless of terminal color settings.
 *
 * @param context - Test context from Deno.test
 * @param actual - The string to compare (color codes will be removed)
 */
export async function assertSnapshotWithoutColors(
  context: Deno.TestContext,
  actual: string,
): Promise<void> {
  await assertSnapshot(context, removeColors(actual));
}
