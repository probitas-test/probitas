# The probitas CLI built from this revision's sources.
#
# The executable embeds the Nix-built Bun, so it runs with the Nix loader on
# Linux and needs no patching. It is never stripped or patched afterwards,
# since the CLI is appended to the Bun runtime.
{
  lib,
  stdenv,
  stdenvNoCC,
  makeWrapper,
  bun,
  src,
  version,
}:

let
  # Every platform's optional dependencies are installed, so one hash covers
  # all systems. Update it when bun.lock changes: the CI's Nix build prints
  # the expected value on a mismatch.
  nodeModules = stdenvNoCC.mkDerivation {
    pname = "probitas-node-modules";
    version = "0";
    inherit src;
    nativeBuildInputs = [ bun ];
    dontConfigure = true;
    buildPhase = ''
      runHook preBuild
      export HOME="$TMPDIR"
      bun install --frozen-lockfile --ignore-scripts --no-progress --os='*' --cpu='*'
      runHook postBuild
    '';
    installPhase = ''
      runHook preInstall
      cp -R node_modules "$out"
      runHook postInstall
    '';
    dontFixup = true;
    outputHashMode = "recursive";
    outputHashAlgo = "sha256";
    outputHash = "sha256-F+lvyqpROB3mj7fy1F7WA3PTy4acY7eGlt0mV2vSoYE=";
  };
in
stdenv.mkDerivation {
  pname = "probitas";
  inherit version src;

  nativeBuildInputs = [ bun makeWrapper ];

  configurePhase = ''
    runHook preConfigure
    cp -R ${nodeModules} node_modules
    chmod -R u+w node_modules
    runHook postConfigure
  '';

  # `--version` and `probitas init` read the version from package.json.
  buildPhase = ''
    runHook preBuild
    export HOME="$TMPDIR"
    bun pm pkg set version=${version}
    bun scripts/compile.ts --outfile probitas --executable-path ${bun}/bin/bun
    runHook postBuild
  '';

  # The DuckDB binding probitas downloads on first use links libstdc++, which
  # the Nix loader does not find on its own.
  installPhase = ''
    runHook preInstall
    install -Dm755 probitas $out/libexec/probitas
    makeWrapper $out/libexec/probitas $out/bin/probitas \
      ${lib.optionalString stdenv.hostPlatform.isLinux "--prefix LD_LIBRARY_PATH : ${lib.makeLibraryPath [ stdenv.cc.cc.lib ]}"}
    runHook postInstall
  '';

  dontStrip = true;
  dontPatchELF = true;

  # Make sure the CLI appended to the runtime runs, including the worker it
  # re-spawns for scenarios.
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

  passthru = { inherit nodeModules; };

  meta = {
    description = "Scenario-based testing and workflow execution framework";
    homepage = "https://github.com/probitas-test/probitas";
    license = lib.licenses.mit;
    mainProgram = "probitas";
    platforms = [
      "aarch64-darwin"
      "x86_64-darwin"
      "aarch64-linux"
      "x86_64-linux"
    ];
  };
}
