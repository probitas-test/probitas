### 2025.12.22

#### @probitas/builder 0.4.1 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/core 0.2.1 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/discover 0.3.3 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/expect 0.3.2 (patch)

- fix(@probitas/expect): Fix expectation matcher typings
- fix(@probitas/expect): Fix expect(any) overload to prevent type inference
  issues
- docs(*): add any/unknown typing rule

#### @probitas/logger 0.3.1 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/probitas 0.6.1 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/reporter 0.6.1 (patch)

- docs(*): add any/unknown typing rule

#### @probitas/runner 0.4.1 (patch)

- docs(*): add any/unknown typing rule

### 2025.12.19

#### @probitas/expect 0.3.1 (patch)

- refactor(@probitas/expect): replace unknown with any in mixin type parameters

### 2025.12.19

#### @probitas/discover 0.3.2 (patch)

- perf(@probitas/discover): skip excluded directories during walk for faster
  discovery

### 2025.12.19

#### @probitas/discover 0.3.1 (patch)

- feat(@probitas/discover): add progress callback for real-time feedback

### 2025.12.19

#### @probitas/builder 0.4.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/core 0.2.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/discover 0.3.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/expect 0.3.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- feat(@probitas/expect)!: rename HTTP data API to json
- fix(@probitas/expect): adapt Redis assertions to probitas-client breaking
  changes
- fix(@probitas/expect): adapt RabbitMQ assertions to probitas-client breaking
  changes
- fix(@probitas/expect): adapt MongoDB assertions to nullable fields
- fix(@probitas/expect): adapt SQS assertions and test utilities to
  probitas-client breaking changes
- fix(@probitas/expect): adapt Deno KV test utilities to discriminated union
  types
- fix(@probitas/expect): adapt SQL query assertions to nullable fields
- fix(@probitas/expect): adapt ConnectRPC/gRPC assertions to nullable fields
- fix(@probitas/expect): adapt GraphQL response assertions to nullable fields
- fix(@probitas/expect): add null safety checks to HTTP response assertions
- fix(@probitas/expect): adapt tests to ClientResult type changes in
  probitas-client
- fix(@probitas/expect)!: adapt GraphQL response API to single error object
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/logger 0.3.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/probitas 0.6.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/reporter 0.6.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

#### @probitas/runner 0.4.0 (minor)

- BREAKING(*): adapt to probitas-client breaking changes
- test(*): convert all test files from BDD to Deno.test style
- chore(*): update dependencies to latest versions

### 2025.12.17

#### @probitas/expect 0.2.6 (patch)

- fix(@probitas/expect): export missing type

### 2025.12.17

#### @probitas/probitas 0.5.5 (patch)

- docs(probitas): add JSDoc for re-exported external packages
- refactor(probitas): replace @jackfiszr/faker with @faker-js/faker

### 2025.12.17

#### @probitas/builder 0.3.2 (patch)

- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/core 0.1.2 (patch)

- fix(@probitas/core,@probitas/discover,@probitas/reporter): remove redundant
  error logging
- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/discover 0.2.12 (patch)

- fix(@probitas/core,@probitas/discover,@probitas/reporter): remove redundant
  error logging
- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/expect 0.2.4 (patch)

- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/logger 0.2.12 (patch)

- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/probitas 0.5.4 (patch)

- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task
- refactor(@probitas/probitas): use {module}.ts for submodule entry points

#### @probitas/reporter 0.5.2 (patch)

- fix(@probitas/core,@probitas/discover,@probitas/reporter): remove redundant
  error logging
- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task

#### @probitas/runner 0.3.3 (patch)

- docs(*): fix docstring examples to pass --doc type checking
- docs(*): reorganize .claude documentation structure
- refactor(*): move --doc flag from test to check task
- refactor(@probitas/runner): rename testutil.ts to _testutils.ts

### 2025.12.16

#### @probitas/builder 0.3.1 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/core 0.1.1 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/discover 0.2.11 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/expect 0.2.3 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/logger 0.2.11 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/probitas 0.5.3 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/reporter 0.5.1 (patch)

- refactor(*): move CLI to separate repository

#### @probitas/runner 0.3.2 (patch)

- refactor(*): move CLI to separate repository

### 2025.12.16

#### @probitas/cli 0.7.1 (patch)

- feat(@probitas/cli): enable logging in worker processes
- fix(@probitas/cli): handle unhandled promise rejections in worker

### 2025.12.16

#### @probitas/builder 0.3.0 (minor)

- BREAKING(@probitas/core,@probitas/reporter,@probitas/builder,@probitas/cli):
  rename Source to Origin and consolidate utilities
- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios

#### @probitas/cli 0.7.0 (minor)

- BREAKING(@probitas/core,@probitas/reporter,@probitas/builder,@probitas/cli):
  rename Source to Origin and consolidate utilities
- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios
- refactor(@probitas/expect,@probitas/reporter,@probitas/cli): improve error
  serialization and display
- refactor(@probitas/core,@probitas/cli): use subpath exports for loader and
  selector

#### @probitas/core 0.1.0 (minor)

- BREAKING(@probitas/core,@probitas/reporter,@probitas/builder,@probitas/cli):
  rename Source to Origin and consolidate utilities
- BREAKING(@probitas/core): rename @probitas/scenario to @probitas/core
- feat(@probitas/core): add stack trace parsing utilities
- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios
- refactor(@probitas/expect,@probitas/core): improve error message styling and
  formatting
- refactor(@probitas/core,@probitas/expect): add removeColors and
  assertSnapshotWithoutColors
- refactor(@probitas/core,@probitas/reporter): move theme module to
  @probitas/core
- refactor(@probitas/core,@probitas/cli): use subpath exports for loader and
  selector

#### @probitas/discover 0.2.10 (patch)

- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios

#### @probitas/expect 0.2.2 (patch)

- feat(@probitas/expect): improve Subject display with Uint8Array formatting
- feat(@probitas/expect): add diff display for comparison matchers
- feat(@probitas/expect): add source code context to expectation errors
- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios
- refactor(@probitas/expect): use cfg helper for mixin config and pass subject
  to errors
- refactor(@probitas/expect,@probitas/reporter,@probitas/cli): improve error
  serialization and display
- refactor(@probitas/expect,@probitas/core): improve error message styling and
  formatting
- refactor(@probitas/core,@probitas/expect): add removeColors and
  assertSnapshotWithoutColors

#### @probitas/logger 0.2.10 (patch)

- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios

#### @probitas/probitas 0.5.2 (patch)

- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios

#### @probitas/reporter 0.5.0 (minor)

- BREAKING(@probitas/reporter): remove DotReporter and TapReporter
- BREAKING(@probitas/core,@probitas/reporter,@probitas/builder,@probitas/cli):
  rename Source to Origin and consolidate utilities
- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios
- refactor(@probitas/expect,@probitas/reporter,@probitas/cli): improve error
  serialization and display
- refactor(@probitas/core,@probitas/reporter): move theme module to
  @probitas/core

#### @probitas/runner 0.3.1 (patch)

- docs(*): add failure example scenarios for all client types
- docs(*): add availability checks to external resource scenarios

### 2025.12.15

#### @probitas/builder 0.2.9 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(@probitas/builder): store absolute paths in Source.file
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/cli 0.6.0 (minor)

- BREAKING(@probitas/cli): remove init command
- feat(@probitas/cli): add Worker-based parallel execution infrastructure
- docs(*): update documentation for 0.6.0 release
- refactor(@probitas/cli): remove obsolete import map for subprocess execution
- refactor(@probitas/cli): migrate config to probitas.json format
- refactor(@probitas/cli): migrate list command to in-process execution
- refactor(@probitas/cli): migrate run command from subprocess to Worker
  execution
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/discover 0.2.9 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/expect 0.2.1 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/logger 0.2.9 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/probitas 0.5.1 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/reporter 0.4.0 (minor)

- BREAKING(@probitas/runner,@probitas/reporter): change Reporter interface to
  use Metadata types
- feat(@probitas/reporter): add cwd option for relative path display
- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/runner 0.3.0 (minor)

- BREAKING(@probitas/runner,@probitas/reporter): change Reporter interface to
  use Metadata types
- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

#### @probitas/scenario 0.2.9 (patch)

- docs(*): update documentation for 0.6.0 release
- refactor(*): use jsr: specifier in example scenarios

### 2025.12.12

#### @probitas/builder 0.2.8 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/cli 0.4.1 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/discover 0.2.8 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/expect 0.2.0 (minor)

- BREAKING(@probitas/expect): migrate to mixin-based expectation architecture
- feat(@probitas/expect): refactor AnythingExpectation to use state-based
  negation
- feat(@probitas/expect): Add comprehensive mixin system for type-safe
  expectations
- feat(@probitas/expect): Add boolean XOR utility to convert boolean values
- feat(@probitas/expect): Add tryOk utility to convert exceptions to boolean
  results
- feat(@probitas/expect): Add toPascalCase utility function
- feat(@probitas/expect): Add `catchError` utility for error handling in tests
- fix(@probitas/expect): Return NonNullable type from getNonNull function
- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README
- refactor(@probitas/expect): rename common/ to utils/ and consolidate imports
- refactor(@probitas/expect): rename getNonNull to ensureNonNullish
- refactor(@probitas/expect): rename format.ts to format_value.ts
- refactor(@probitas/expect): remove obsolete common/ utilities after mixin
  migration
- refactor(@probitas/expect): split sqs.ts into modular structure
- refactor(@probitas/expect): split redis.ts into modular structure
- refactor(@probitas/expect): split rabbitmq.ts into modular structure
- refactor(@probitas/expect): split mongodb.ts into modular structure
- refactor(@probitas/expect): split deno_kv.ts into modular structure

#### @probitas/logger 0.2.8 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/probitas 0.4.1 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/reporter 0.3.3 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/runner 0.2.8 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

#### @probitas/scenario 0.2.8 (patch)

- docs(*): add migration guide from 0.4.0 to 0.5.0 and update README

### 2025.12.09

#### @probitas/expect 0.1.2 (patch)

- docs(@probitas/expect): add comprehensive JSDoc to all expectation interfaces

### 2025.12.09

#### @probitas/expect 0.1.1 (patch)

- docs(@probitas/expect): update JSDoc examples to use new API naming convention

### 2025.12.09

#### @probitas/builder 0.2.7 (patch)

- docs(*): update all examples to use scenario-based patterns

#### @probitas/cli 0.4.0 (patch)

- BREAKING(@probitas/probitas): Phase 3.1-7 - comprehensive API improvements
- BREAKING(@probitas/probitas): Phase 3 - rename implementation-specific detail
  methods
- BREAKING(@probitas/probitas): rename implementation-specific methods (Phase 2)
- BREAKING(@probitas/probitas): rename common methods to match @std/expect
  conventions
- docs(*): update all examples to use scenario-based patterns

#### @probitas/discover 0.2.7 (patch)

- docs(*): update all examples to use scenario-based patterns

#### @probitas/expect 0.1.0 (minor)

- feat(expect): create @probitas/expect package with unified expect function
- refactor(expect): extract error message builders to common utilities

#### @probitas/logger 0.2.7 (patch)

- docs(*): update all examples to use scenario-based patterns

#### @probitas/probitas 0.4.0 (minor)

- BREAKING(@probitas/probitas): Phase 3.1-7 - comprehensive API improvements
- BREAKING(@probitas/probitas): Phase 3 - rename implementation-specific detail
  methods
- BREAKING(@probitas/probitas): rename implementation-specific methods (Phase 2)
- BREAKING(@probitas/probitas): rename common methods to match @std/expect
  conventions
- docs(*): update all examples to use scenario-based patterns

#### @probitas/reporter 0.3.2 (patch)

- docs(*): update all examples to use scenario-based patterns

#### @probitas/runner 0.2.7 (patch)

- docs(*): update all examples to use scenario-based patterns

#### @probitas/scenario 0.2.7 (patch)

- docs(*): update all examples to use scenario-based patterns

### 2025.12.09

#### @probitas/cli 0.3.6 (patch)

- fix(@probitas/cli): handle unhandled promise rejections from node:http2

### 2025.12.09

#### @probitas/reporter 0.3.1 (patch)

- fix(@probitas/reporter): Fix ListReporter on multiline error messages

### 2025.12.08

#### @probitas/builder 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/cli 0.3.4 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/discover 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/logger 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/probitas 0.3.5 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/reporter 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/runner 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

#### @probitas/scenario 0.2.6 (patch)

- docs(*): Document new Runner and Reporter architecture
- refactor(*): Refactor and Refine reporters
- refactor(*): Refactor and Refine scenario runner
- refactor(*): Transform resource/setup step to common step
- refactor(*): Fix option values in definitions
- refactor(*): Rename factory to fn
- refactor(*): Use complex types only in builder
- refactor(*): Make options optional
- refactor(*): Rename SourceLocation to Source

### 2025.12.08

#### @probitas/builder 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/cli 0.3.3 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/discover 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/logger 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/probitas 0.3.4 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/reporter 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/runner 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

#### @probitas/scenario 0.2.5 (patch)

- docs(*): add Publish badge and reorganize packages table
- docs(*): add logo and center-align title in README

### 2025.12.07

#### @probitas/probitas 0.3.3 (patch)

- fix(probitas): export types used in expect function signatures

### 2025.12.07

#### @probitas/builder 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/cli 0.3.2 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/discover 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/logger 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/probitas 0.3.2 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/reporter 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/runner 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

#### @probitas/scenario 0.2.4 (patch)

- fix(*): update examples and docs for probitas-client 0.1.0 breaking changes

### 2025.12.07

#### @probitas/builder 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/cli 0.3.1 (patch)

- feat(cli): improve init command with JSONC comment preservation
- refactor(cli): remove PROBITAS_CONFIG environment variable

#### @probitas/discover 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/logger 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/probitas 0.3.1 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/reporter 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/runner 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

#### @probitas/scenario 0.2.3 (patch)

- docs(*): enhance public API documentation across all packages
- docs(*): enhance JSDoc comments for all packages

### 2025.12.06

#### @probitas/probitas 0.2.3 (patch)

- feat(probitas): Add unified expect function with type-based dispatch
