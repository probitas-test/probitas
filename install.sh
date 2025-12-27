#!/bin/sh
# Install script for @probitas/probitas
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | sh
#   curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_VERSION=0.1.0 sh
#
# Environment variables:
#   PROBITAS_VERSION      Specify the version to install (default: latest)
#   PROBITAS_INSTALL_DIR  Specify the installation directory (default: ~/.deno/bin)

set -e

# Check if required commands are available
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is not installed" >&2
  exit 1
fi

if ! command -v deno >/dev/null 2>&1; then
  echo "Error: deno is not installed" >&2
  echo "Please install Deno first: https://deno.land/" >&2
  exit 1
fi

PACKAGE_NAME="@probitas/probitas"
COMMAND_NAME="probitas"
SUBMODULE_PATH="/cli"
JSR_BASE_URL=`https://jsr.io/${PACKAGE_NAME}`

# Read configuration from environment variables
VERSION="${PROBITAS_VERSION:-}"
INSTALL_DIR="${PROBITAS_INSTALL_DIR:-}"

# Fetch the latest version from JSR if not specified
if [ -z "$VERSION" ]; then
  echo "Fetching latest version..."
  # JSR provides a meta.json file with version information
  VERSION=$(curl -fsSL "${JSR_BASE_URL}/meta.json" | grep -o '"latest":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$VERSION" ]; then
    echo "Error: Failed to fetch latest version" >&2
    exit 1
  fi
fi

echo "Installing ${COMMAND_NAME}@${VERSION}..."

# Create a temporary directory
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Download the deno.lock file
LOCK_URL="${JSR_BASE_URL}/${VERSION}/deno.lock"
LOCK_FILE="${TMPDIR}/deno.lock"

echo "Downloading lock file from ${LOCK_URL}..."
if ! curl -fsSL "$LOCK_URL" -o "$LOCK_FILE"; then
  echo "Error: Failed to download deno.lock from ${LOCK_URL}" >&2
  exit 1
fi

# Build deno install command
DENO_INSTALL_ARGS="-Agf --unstable-kv --lock=$LOCK_FILE -n ${COMMAND_NAME}"

# Add custom install directory if specified
if [ -n "$INSTALL_DIR" ]; then
  DENO_INSTALL_ARGS="$DENO_INSTALL_ARGS --root=$INSTALL_DIR"
  echo "Installing to ${INSTALL_DIR}/bin..."
fi

# Install using deno with the lock file
echo "Running deno install..."
DENO_NO_UPDATE_CHECK=1 deno install $DENO_INSTALL_ARGS "jsr:${PACKAGE_NAME}@${VERSION}${SUBMODULE_PATH}"

echo ""
echo "Successfully installed ${COMMAND_NAME}@${VERSION}"

# Show path hint if custom install directory was used
if [ -n "$INSTALL_DIR" ]; then
  echo ""
  echo "Make sure ${INSTALL_DIR}/bin is in your PATH:"
  echo "  export PATH=\"${INSTALL_DIR}/bin:\$PATH\""
fi
