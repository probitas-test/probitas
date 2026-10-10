# The probitas binary from the GitHub Release named in release.json.
#
# The executable is the Bun runtime with the CLI appended to it, so it is
# never stripped. On Linux the release targets glibc's standard loader path;
# autoPatchelf points it at the Nix one.
{
  lib,
  stdenv,
  fetchurl,
  autoPatchelfHook,
  makeWrapper,
  # Written by scripts/nix_release.ts when a release is published.
  release ?
    if builtins.pathExists ./release.json then
      lib.importJSON ./release.json
    else
      throw "probitas: nix/release.json does not name a release yet",
}:

let
  platforms = {
    aarch64-darwin = "darwin-arm64";
    x86_64-darwin = "darwin-x64";
    aarch64-linux = "linux-arm64";
    x86_64-linux = "linux-x64";
  };
  system = stdenv.hostPlatform.system;
  platform = platforms.${system} or (throw "probitas: no release binary for ${system}");
in
stdenv.mkDerivation {
  pname = "probitas";
  inherit (release) version;

  src = fetchurl {
    url = "https://github.com/probitas-test/probitas/releases/download/v${release.version}/probitas-${platform}.tar.gz";
    sha256 = release.sha256.${platform};
  };
  sourceRoot = ".";

  nativeBuildInputs = [ makeWrapper ] ++ lib.optionals stdenv.hostPlatform.isLinux [ autoPatchelfHook ];
  buildInputs = lib.optionals stdenv.hostPlatform.isLinux [ stdenv.cc.cc.lib ];

  dontStrip = true;

  # The DuckDB binding probitas downloads on first use links libstdc++, which
  # the Nix loader does not find on its own.
  installPhase = ''
    runHook preInstall
    install -Dm755 probitas $out/libexec/probitas
    makeWrapper $out/libexec/probitas $out/bin/probitas \
      ${lib.optionalString stdenv.hostPlatform.isLinux "--prefix LD_LIBRARY_PATH : ${lib.makeLibraryPath [ stdenv.cc.cc.lib ]}"}
    runHook postInstall
  '';

  # Patching the loader rewrites the executable; make sure the CLI appended
  # to it still runs, including the worker it re-spawns for scenarios.
  doInstallCheck = true;
  installCheckPhase = ''
    runHook preInstallCheck
    export HOME="$TMPDIR"
    $out/bin/probitas --version
    mkdir check
    cd check
    cat > ok.probitas.ts <<'EOF'
    import { expect, scenario } from "@probitas-test/probitas";
    export default scenario("install check")
      .step("runs", () => expect(1 + 1).toBe(2))
      .build();
    EOF
    $out/bin/probitas run
    runHook postInstallCheck
  '';

  meta = {
    description = "Scenario-based testing and workflow execution framework";
    homepage = "https://github.com/probitas-test/probitas";
    license = lib.licenses.mit;
    mainProgram = "probitas";
    platforms = builtins.attrNames platforms;
    sourceProvenance = [ lib.sourceTypes.binaryNativeCode ];
  };
}
