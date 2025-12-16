#!/bin/bash
#
# Probitas Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | bash
#
# Options (via environment variables):
#   PROBITAS_VERSION  - Specific version to install (default: latest)
#   PROBITAS_INSTALL_DIR - Installation directory (default: ~/.local/bin)
#
# Examples:
#   # Install latest version
#   curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | bash
#
#   # Install specific version
#   curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | PROBITAS_VERSION=0.7.1 bash
#
#   # Install to custom directory
#   curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash

set -euo pipefail

# Configuration
GITHUB_REPO="jsr-probitas/probitas"
BINARY_NAME="probitas"
INSTALL_DIR="${PROBITAS_INSTALL_DIR:-$HOME/.local/bin}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    printf "${BLUE}==>${NC} %s\n" "$1"
}

success() {
    printf "${GREEN}==>${NC} %s\n" "$1"
}

warn() {
    printf "${YELLOW}Warning:${NC} %s\n" "$1"
}

error() {
    printf "${RED}Error:${NC} %s\n" "$1" >&2
    exit 1
}

# Detect OS
detect_os() {
    local os
    os="$(uname -s)"
    case "$os" in
        Linux*)  echo "linux" ;;
        Darwin*) echo "macos" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) error "Unsupported operating system: $os" ;;
    esac
}

# Detect architecture
detect_arch() {
    local arch
    arch="$(uname -m)"
    case "$arch" in
        x86_64|amd64) echo "x86_64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) error "Unsupported architecture: $arch" ;;
    esac
}

# Get latest version from GitHub API
get_latest_version() {
    local latest_url="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
    local version

    if command -v curl &> /dev/null; then
        version=$(curl -fsSL "$latest_url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
    elif command -v wget &> /dev/null; then
        version=$(wget -qO- "$latest_url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
    else
        error "Neither curl nor wget found. Please install one of them."
    fi

    # Remove 'v' prefix if present
    echo "${version#v}"
}

# Download file
download() {
    local url="$1"
    local output="$2"

    info "Downloading from $url"

    if command -v curl &> /dev/null; then
        curl -fsSL "$url" -o "$output"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$output"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
}

# Main installation logic
main() {
    info "Probitas Installer"
    echo ""

    # Detect platform
    local os arch
    os=$(detect_os)
    arch=$(detect_arch)
    info "Detected platform: ${os}-${arch}"

    # Get version
    local version
    if [[ -n "${PROBITAS_VERSION:-}" ]]; then
        version="$PROBITAS_VERSION"
        info "Installing specified version: $version"
    else
        info "Fetching latest version..."
        version=$(get_latest_version)
        if [[ -z "$version" ]]; then
            error "Failed to determine latest version"
        fi
        info "Latest version: $version"
    fi

    # Determine archive format and extension
    local archive_ext
    if [[ "$os" == "windows" ]]; then
        archive_ext="zip"
    else
        archive_ext="tar.gz"
    fi

    # Construct download URL
    local archive_name="probitas-${version}-${os}-${arch}.${archive_ext}"
    local download_url="https://github.com/${GITHUB_REPO}/releases/download/v${version}/${archive_name}"

    # Create temporary directory
    local tmp_dir
    tmp_dir=$(mktemp -d)
    trap "rm -rf '$tmp_dir'" EXIT

    # Download archive
    local archive_path="${tmp_dir}/${archive_name}"
    download "$download_url" "$archive_path"

    # Extract archive
    info "Extracting archive..."
    if [[ "$archive_ext" == "zip" ]]; then
        if command -v unzip &> /dev/null; then
            unzip -q "$archive_path" -d "$tmp_dir"
        else
            error "unzip command not found. Please install unzip."
        fi
    else
        tar -xzf "$archive_path" -C "$tmp_dir"
    fi

    # Create installation directory
    mkdir -p "$INSTALL_DIR"

    # Install binary
    local binary_src="${tmp_dir}/${BINARY_NAME}"
    if [[ "$os" == "windows" ]]; then
        binary_src="${binary_src}.exe"
    fi

    if [[ ! -f "$binary_src" ]]; then
        error "Binary not found in archive: $binary_src"
    fi

    local binary_dest="${INSTALL_DIR}/${BINARY_NAME}"
    if [[ "$os" == "windows" ]]; then
        binary_dest="${binary_dest}.exe"
    fi

    info "Installing to ${binary_dest}..."
    mv "$binary_src" "$binary_dest"
    chmod +x "$binary_dest"

    echo ""
    success "Probitas ${version} has been installed to ${binary_dest}"
    echo ""

    # Check if installation directory is in PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        warn "$INSTALL_DIR is not in your PATH"
        echo ""
        echo "Add the following to your shell configuration file:"
        echo ""
        echo "  For bash (~/.bashrc):"
        echo "    export PATH=\"\$PATH:$INSTALL_DIR\""
        echo ""
        echo "  For zsh (~/.zshrc):"
        echo "    export PATH=\"\$PATH:$INSTALL_DIR\""
        echo ""
        echo "  For fish (~/.config/fish/config.fish):"
        echo "    fish_add_path $INSTALL_DIR"
        echo ""
    else
        info "Run 'probitas --help' to get started"
    fi
}

main "$@"
