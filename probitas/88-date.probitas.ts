/**
 * Date Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Date Serialization")
  .step("Return Date values", () => {
    // Date is serialized as ISO string by JSON.stringify (loses type info)
    return {
      now: new Date(),
      epoch: new Date(0),
      specific: new Date("2024-01-15T12:00:00Z"),
      invalid: new Date("invalid"),
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the Date values
    return {
      nowIsDate: ctx.previous.now instanceof Date,
      nowTime: ctx.previous.now.getTime(),
      epochIsDate: ctx.previous.epoch instanceof Date,
      epochTime: ctx.previous.epoch.getTime(),
      specificYear: ctx.previous.specific.getUTCFullYear(),
      invalidIsNaN: Number.isNaN(ctx.previous.invalid.getTime()),
    };
  })
  .build();
