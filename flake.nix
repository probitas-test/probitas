{
  description = "Probitas development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # nixpkgs lags behind Bun releases, and gRPC server streaming over
        # node:http2 needs Bun >= 1.4. Reuse the nixpkgs derivation (patching,
        # completions) with the upstream release binary.
        bunVersion = "1.4.3";
        bunSources = {
          x86_64-linux = {
            asset = "bun-linux-x64.zip";
            hash = "sha256-PnMFKNiXdfA/h/BcBnh8TfQJnQo38/JS57gpyyOBbhg=";
          };
          aarch64-linux = {
            asset = "bun-linux-aarch64.zip";
            hash = "sha256-76mBPaXtckI7+Ef5FujSxHwNd2rdlyNUAmp14Q2pqiE=";
          };
          x86_64-darwin = {
            asset = "bun-darwin-x64.zip";
            hash = "sha256-YmYOZDjrhyJ4h3rMp34RUtXQMTJN82jUqBtCghFInS0=";
          };
          aarch64-darwin = {
            asset = "bun-darwin-aarch64.zip";
            hash = "sha256-gK/UwGm0am+o8+xSC+vHUKeEPkqNW5WD0prUNsAKNAM=";
          };
        };
        bun = pkgs.bun.overrideAttrs (_: {
          version = bunVersion;
          src = pkgs.fetchurl {
            url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${bunSources.${system}.asset}";
            inherit (bunSources.${system}) hash;
          };
        });
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            bun
            # scripts/compile.ts extracts the official Bun runtime it embeds.
            pkgs.unzip
            # scripts/package_release.ts zips the Windows build.
            pkgs.zip
          ];

          # Prebuilt native addons (DuckDB's duckdb.node) link libstdc++, which
          # Nix's dynamic loader does not find on its own.
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];

          shellHook = ''
            echo "Entering Probitas development environment" >&2
          '';
        };
      }
    );
}
