/**
 * Worker entry point (`probitas __worker <run|list> --ipc-port <port>`)
 *
 * Maps Probitas specifiers used by scenarios to the modules bundled into this
 * executable, so scenarios run without installing anything and share one
 * instance of every Probitas module with the runner.
 *
 * @module
 * @internal
 */

import { plugin } from "bun";
import process from "node:process";
import * as probitas from "../mod.ts";
import * as client from "../client.ts";
import * as clientConnectrpc from "../client/connectrpc.ts";
import * as clientGraphql from "../client/graphql.ts";
import * as clientGrpc from "../client/grpc.ts";
import * as clientHttp from "../client/http.ts";
import * as clientHttpOidc from "../client/http/oidc.ts";
import * as clientMongodb from "../client/mongodb.ts";
import * as clientRabbitmq from "../client/rabbitmq.ts";
import * as clientRedis from "../client/redis.ts";
import * as clientSql from "../client/sql.ts";
import * as clientSqlDuckdb from "../client/sql/duckdb.ts";
import * as clientSqlMysql from "../client/sql/mysql.ts";
import * as clientSqlPostgres from "../client/sql/postgres.ts";
import * as clientSqlSqlite from "../client/sql/sqlite.ts";
import * as clientSqs from "../client/sqs.ts";
import * as expect from "../expect.ts";

/** `@probitas-test/probitas` and its subpath exports. */
const probitasModules: Record<string, Record<string, unknown>> = {
  "": probitas,
  "/client": client,
  "/client/connectrpc": clientConnectrpc,
  "/client/graphql": clientGraphql,
  "/client/grpc": clientGrpc,
  "/client/http": clientHttp,
  "/client/http/oidc": clientHttpOidc,
  "/client/mongodb": clientMongodb,
  "/client/rabbitmq": clientRabbitmq,
  "/client/redis": clientRedis,
  "/client/sql": clientSql,
  "/client/sql/duckdb": clientSqlDuckdb,
  "/client/sql/mysql": clientSqlMysql,
  "/client/sql/postgres": clientSqlPostgres,
  "/client/sql/sqlite": clientSqlSqlite,
  "/client/sqs": clientSqs,
  "/expect": expect,
};

/** Client packages that scenarios also import directly, by package name. */
const clientPackages: Record<string, Record<string, unknown>> = {
  "client-connectrpc": clientConnectrpc,
  "client-graphql": clientGraphql,
  "client-grpc": clientGrpc,
  "client-http": clientHttp,
  "client-mongodb": clientMongodb,
  "client-rabbitmq": clientRabbitmq,
  "client-redis": clientRedis,
  "client-sql": clientSql,
  "client-sqs": clientSqs,
};

/**
 * Every spelling a scenario may use for a Probitas module: the npm name, and
 * the Deno-era JSR names (`jsr:@probitas/<name>@^0` and so on) so existing
 * scenarios keep running before they are migrated.
 */
function specifiers(name: string, subpath: string): string[] {
  return [
    `@probitas-test/${name}${subpath}`,
    `@probitas/${name}${subpath}`,
    `jsr:@probitas/${name}${subpath}`,
    `jsr:@probitas/${name}@^0${subpath}`,
    `jsr:@probitas/${name}@^1${subpath}`,
  ];
}

plugin({
  name: "probitas-embedded",
  setup(build) {
    const register = (specifier: string, exports: Record<string, unknown>) =>
      build.module(specifier, () => ({ exports, loader: "object" }));
    for (const [subpath, exports] of Object.entries(probitasModules)) {
      for (const s of specifiers("probitas", subpath)) register(s, exports);
    }
    for (const [name, exports] of Object.entries(clientPackages)) {
      for (const s of specifiers(name, "")) register(s, exports);
    }
  },
});

const name = process.argv[process.argv.indexOf("__worker") + 1];
switch (name) {
  case "run":
    await import("./_templates/run.ts");
    break;
  case "list":
    await import("./_templates/list.ts");
    break;
  default:
    throw new Error(`Unknown worker: ${name}`);
}
