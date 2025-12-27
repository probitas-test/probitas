{
  description = "Probitas CLI - Command-line interface for Probitas";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      # Overlay that adds probitas to pkgs
      overlay = final: prev: {
        probitas = prev.writeShellApplication {
          name = "probitas";
          runtimeInputs = [
            prev.deno
            prev.coreutils
            # Native library dependencies for database clients
            prev.stdenv.cc.cc.lib
            prev.sqlite
            prev.duckdb
          ];
          text = ''
            export DENO_NO_UPDATE_CHECK=1

            # Add native library paths for database clients (FFI support)
            export LD_LIBRARY_PATH="${prev.lib.makeLibraryPath [
              prev.stdenv.cc.cc.lib
              prev.sqlite
              prev.duckdb
            ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

            # Copy lock file to writable location to avoid /nix/store read-only errors
            TEMP_LOCK=$(mktemp)
            cp ${self}/deno.lock "$TEMP_LOCK"
            trap 'rm -f "$TEMP_LOCK"' EXIT

            exec deno run -A \
              --unstable-kv \
              --config=${self}/deno.json \
              --lock="$TEMP_LOCK" \
              ${self}/src/cli.ts "$@"
          '';
        };
      };
    in
    {
      # Overlay for easy integration
      overlays.default = overlay;
    }
    //
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ overlay ];
        };
      in
      {
        packages = {
          inherit (pkgs) probitas;
          default = pkgs.probitas;
        };

        apps.default = flake-utils.lib.mkApp {
          drv = pkgs.probitas;
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            deno
            # Native library dependencies for database clients
            stdenv.cc.cc.lib  # C++ standard library (required by most native bindings)
            sqlite            # SQLite library (for @db/sqlite via FFI)
            duckdb            # DuckDB library (for @duckdb/node-api)
          ];

          shellHook = ''
            # Add native library paths for database clients
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
              pkgs.stdenv.cc.cc.lib
              pkgs.sqlite
              pkgs.duckdb
            ]}:$LD_LIBRARY_PATH"
            echo "Entering Probitas development environment"
          '';
        };
      }
    );
}
