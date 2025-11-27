/**
 * Tests for TAPReporter
 *
 * Uses the testReporter helper function to verify reporter output with various
 * scenario results and run summaries, both with and without color output.
 *
 * @requires --allow-read Permission to read snapshot files
 * @requires --allow-write Permission to write snapshot files during updates
 * @module
 */

import { TAPReporter } from "./tap_reporter.ts";
import { testReporter } from "./testkit.ts";

testReporter(TAPReporter);
