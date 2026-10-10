#!/bin/sh
# Install script for the probitas CLI
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | sh
#   curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_VERSION=2.0.0 sh
#
# Environment variables:
#   PROBITAS_VERSION      Version to install (default: the latest GitHub Release)
#   PROBITAS_INSTALL_DIR  Installation root; the binary goes to
#                         $PROBITAS_INSTALL_DIR/bin (default: ~/.local)
#
# Probitas 2 and later is a single binary downloaded from the GitHub Release
# and verified against its SHA256SUMS. Probitas 1.x was a Deno program; asking
# for a 1.x version installs it with Deno exactly as before.

set -eu

REPO="probitas-test/probitas"
COMMAND_NAME="probitas"
# Overridable so the script can be tested against a local release mirror.
RELEASE_BASE_URL="${PROBITAS_RELEASE_BASE_URL:-https://github.com/${REPO}/releases}"

VERSION="${PROBITAS_VERSION:-}"
VERSION="${VERSION#v}"
INSTALL_ROOT="${PROBITAS_INSTALL_DIR:-}"

die() {
  echo "Error: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is not installed"
}

need curl

latest_version() {
  # The /latest page redirects to /tag/v<version>; reading the redirect avoids
  # the GitHub API and its rate limit.
  url=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "${RELEASE_BASE_URL}/latest") ||
    die "Failed to look up the latest release"
  tag="${url##*/tag/}"
  [ "$tag" != "$url" ] || die "Failed to look up the latest release"
  echo "${tag#v}"
}

install_legacy() {
  # Probitas 1.x: installed from JSR with Deno, as the 1.x install script did.
  need deno
  jsr_base="https://jsr.io/@probitas/probitas"
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  echo "Downloading lock file for ${COMMAND_NAME}@${VERSION}..."
  curl -fsSL "${jsr_base}/${VERSION}/deno.lock" -o "${tmp}/deno.lock" ||
    die "Failed to download deno.lock for ${VERSION}"
  set -- -Agf --unstable-kv --lock="${tmp}/deno.lock" -n "$COMMAND_NAME"
  if [ -n "$INSTALL_ROOT" ]; then
    set -- "$@" --root="$INSTALL_ROOT"
  fi
  DENO_NO_UPDATE_CHECK=1 deno install "$@" "jsr:@probitas/probitas@${VERSION}/cli"
  echo "Successfully installed ${COMMAND_NAME}@${VERSION}"
}

detect_platform() {
  case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux) os="linux" ;;
    *) die "Unsupported OS: $(uname -s) (download a binary from ${RELEASE_BASE_URL})" ;;
  esac
  case "$(uname -m)" in
    x86_64 | amd64) arch="x64" ;;
    arm64 | aarch64) arch="arm64" ;;
    *) die "Unsupported architecture: $(uname -m)" ;;
  esac
  if [ "$os" = "linux" ] && ldd --version 2>&1 | grep -qi musl; then
    die "musl-based Linux (e.g. Alpine) is not supported yet"
  fi
  echo "${os}-${arch}"
}

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | cut -d' ' -f1
  else
    die "Neither sha256sum nor shasum is available to verify the download"
  fi
}

install_binary() {
  need tar
  platform=$(detect_platform)
  archive="${COMMAND_NAME}-${platform}.tar.gz"
  base="${RELEASE_BASE_URL}/download/v${VERSION}"
  root="${INSTALL_ROOT:-$HOME/.local}"
  bin_dir="${root}/bin"

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  echo "Downloading ${archive} (${VERSION})..."
  curl -fsSL "${base}/${archive}" -o "${tmp}/${archive}" ||
    die "Failed to download ${base}/${archive}"
  curl -fsSL "${base}/SHA256SUMS" -o "${tmp}/SHA256SUMS" ||
    die "Failed to download ${base}/SHA256SUMS"

  expected=$(grep " ${archive}\$" "${tmp}/SHA256SUMS" | cut -d' ' -f1)
  [ -n "$expected" ] || die "${archive} is not listed in SHA256SUMS"
  actual=$(sha256 "${tmp}/${archive}")
  [ "$expected" = "$actual" ] ||
    die "Checksum mismatch for ${archive} (expected ${expected}, got ${actual})"

  tar -xzf "${tmp}/${archive}" -C "$tmp"
  mkdir -p "$bin_dir"
  mv "${tmp}/${COMMAND_NAME}" "${bin_dir}/${COMMAND_NAME}"
  chmod +x "${bin_dir}/${COMMAND_NAME}"
  echo "Successfully installed ${COMMAND_NAME}@${VERSION} to ${bin_dir}/${COMMAND_NAME}"

  case ":${PATH}:" in
    *":${bin_dir}:"*) ;;
    *)
      echo ""
      echo "Add ${bin_dir} to your PATH:"
      echo "  export PATH=\"${bin_dir}:\$PATH\""
      ;;
  esac
}

if [ -z "$VERSION" ]; then
  echo "Looking up the latest version..."
  VERSION=$(latest_version)
fi

case "$VERSION" in
  0.* | 1.*) install_legacy ;;
  *) install_binary ;;
esac
