{
  description = "Probitas development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      # nixpkgs lags behind Bun releases, and gRPC server streaming over
      # node:http2 needs Bun >= 1.4. Reuse the nixpkgs derivation (patching,
      # completions) with the upstream release binary.
      bunVersion = "1.4.4";
      bunSources = {
        x86_64-linux = {
          asset = "bun-linux-x64.zip";
          hash = "sha256-v4zL+ysLgBWeD5ptFcVTF63YB3U028YTCj7bUvzLOVw=";
        };
        aarch64-linux = {
          asset = "bun-linux-aarch64.zip";
          hash = "sha256-uqa7NvUdblhWHgK76oJQOKnfRU9nPW13bou/hvjHhQ4=";
        };
        x86_64-darwin = {
          asset = "bun-darwin-x64.zip";
          hash = "sha256-UKNJH3Orwv6BZzFxqFdi07wswWgMzsrdmD3pmt93l34=";
        };
        aarch64-darwin = {
          asset = "bun-darwin-aarch64.zip";
          hash = "sha256-wkDX8My5DCY6hJ/NsJt+5iYw2SE0jtaq/ahrnVd7xRA=";
        };
      };

      # The systems Bun publishes a release binary for.
      systems = builtins.attrNames bunSources;
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      bunFor =
        pkgs:
        let
          source = bunSources.${pkgs.stdenv.hostPlatform.system};
        in
        pkgs.bun.overrideAttrs (_: {
          version = bunVersion;
          src = pkgs.fetchurl {
            url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${source.asset}";
            inherit (source) hash;
          };
        });

      # Builds of an unreleased revision; released versions are the tags.
      version = "0.0.0-unstable.${
        builtins.substring 0 8 (self.lastModifiedDate or "19700101")
      }.${self.shortRev or "dirty"}";

      src = nixpkgs.lib.fileset.toSource {
        root = ./.;
        fileset = nixpkgs.lib.fileset.unions [
          ./package.json
          ./bun.lock
          ./bunfig.toml
          ./tsconfig.json
          ./src
          ./scripts
          ./assets
          ./internal
        ];
      };

      probitasFor =
        pkgs:
        pkgs.callPackage ./nix/probitas.nix {
          bun = bunFor pkgs;
          inherit src version;
        };
    in
    {
      overlays.default = final: _prev: {
        probitas = probitasFor final;
      };

      packages = forAllSystems (
        pkgs:
        let
          probitas = probitasFor pkgs;
        in
        {
          inherit probitas;
          default = probitas;
        }
      );

      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            (bunFor pkgs)
            pkgs.just
            pkgs.nixfmt
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
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt);
    };
}
