/**
 * Read and rewrite the Bun release flake.nix pins: `bunVersion` and the hash
 * of each platform's release asset in `bunSources`.
 *
 * @module
 */

export interface BunPin {
  readonly version: string;
  readonly assets: readonly string[];
}

const versionPattern = /bunVersion = "([^"]+)";/;
const sourcePattern = /(asset = "([^"]+)";\s*hash = ")([^"]+)(";)/g;

export function readBunPin(flake: string): BunPin {
  const version = flake.match(versionPattern)?.[1];
  if (version === undefined) {
    throw new Error("flake.nix does not pin bunVersion");
  }
  const assets = [...flake.matchAll(sourcePattern)].map((match) => match[2]);
  return { version, assets };
}

export function pinBun(
  flake: string,
  version: string,
  hashes: Readonly<Record<string, string>>,
): string {
  return flake
    .replace(versionPattern, `bunVersion = "${version}";`)
    .replace(sourcePattern, (_, head: string, asset: string, _hash, tail) => {
      const hash = hashes[asset];
      if (hash === undefined) {
        throw new Error(`No hash given for the Bun release asset ${asset}`);
      }
      return `${head}${hash}${tail}`;
    });
}
