/**
 * RegExp Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("RegExp Serialization")
  .step("Return RegExp values", () => {
    // RegExp is serialized as empty object {} by JSON.stringify
    return {
      pattern: /hello\s+world/gi,
      email: new RegExp("^[a-z]+@[a-z]+\\.[a-z]+$", "i"),
      unicode: /\p{Script=Hiragana}+/u,
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the RegExp values
    return {
      patternIsRegExp: ctx.previous.pattern instanceof RegExp,
      patternSource: ctx.previous.pattern.source,
      emailIsRegExp: ctx.previous.email instanceof RegExp,
      unicodeFlags: ctx.previous.unicode.flags,
    };
  })
  .build();
