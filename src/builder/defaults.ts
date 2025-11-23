/**
 * Default options for the Builder layer
 *
 * Default values applied to scenarios and steps when no explicit options provided.
 *
 * @module
 */

import type { ScenarioOptions, StepOptions } from "../runner/types.ts";

/**
 * Default scenario options
 *
 * Applied to all scenarios unless overridden.
 */
export const DEFAULT_SCENARIO_OPTIONS: ScenarioOptions = {
  tags: [],
  skip: null,
  setup: null,
  teardown: null,
  stepOptions: {
    timeout: 30000,
    retry: {
      maxAttempts: 1,
      backoff: "linear",
    },
  },
};

/**
 * Default step options
 *
 * Applied to all steps unless overridden at scenario or step level.
 */
export const DEFAULT_STEP_OPTIONS: StepOptions = {
  timeout: 30000,
  retry: {
    maxAttempts: 1,
    backoff: "linear",
  },
};
