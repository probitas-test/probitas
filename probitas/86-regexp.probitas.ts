/**
 * RegExp Serialization Test Scenario
 */
import { scenario } from "@probitas-test/probitas";

export default scenario("RegExp Serialization")
  .step("Return RegExp values", () => {
    // RegExp is serialized via CBOR tagged value
    return {
      pattern: /hello\s+world/gi,
      // biome-ignore lint/complexity/useRegexLiterals: exercises a RegExp built from a string
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
