# The Nix package built from a locally packaged archive instead of a GitHub
# Release, so CI can check it (and its install check) before releasing.
#
#   bun run package --target bun-linux-x64 --out out/release
#   nix build --impure -L -f nix/from-archive.nix --arg archive ./out/release/probitas-linux-x64.tar.gz
{ archive }:
let
  flake = builtins.getFlake (toString ../.);
  pkgs = import flake.inputs.nixpkgs { system = builtins.currentSystem; };
  package = pkgs.callPackage ./probitas.nix {
    release = {
      version = "0.0.0-local";
      sha256 = { };
    };
  };
in
package.overrideAttrs { src = archive; }
