/**
 * Error Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Error Serialization")
  .step("Return Error values", () => {
    // Error is serialized via CBOR tagged value (preserves name, message, stack, custom properties)
    const error = new Error("Something went wrong");
    const typeError = new TypeError("Invalid type");
    const customError = Object.assign(new Error("Custom"), {
      code: "ERR_CUSTOM",
      details: { foo: "bar" },
    });
    return {
      error,
      typeError,
      customError,
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the Error values
    return {
      errorIsError: ctx.previous.error instanceof Error,
      errorMessage: ctx.previous.error.message,
      errorHasStack: typeof ctx.previous.error.stack === "string",
      typeErrorName: ctx.previous.typeError.name,
      customErrorCode: ctx.previous.customError.code,
    };
  })
  .build();
