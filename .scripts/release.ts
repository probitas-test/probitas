#!/usr/bin/env -S deno run -A
/**
 * Prepare a release by updating version, dependencies, and creating a PR
 *
 * Usage:
 *   deno task release <version>          # Create PR
 *   deno task release <version> --skip-pr  # Skip PR creation
 *
 * Examples:
 *   deno task release v1.2.3
 *   deno task release 1.2.3 --skip-pr
 *
 * This script performs:
 * 1. Update version in deno.json
 * 2. Update deno.lock with new version
 * 3. Update flake.lock (if Nix is available)
 * 4. Create release branch and PR (unless --skip-pr is specified)
 *
 * @module
 */

const VERSION_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;

function parseVersion(input: string): { version: string; tag: string } {
  const match = input.match(VERSION_PATTERN);
  if (!match) {
    throw new Error(
      `Invalid version format: "${input}". Expected semver (e.g., "1.2.3" or "v1.2.3")`,
    );
  }
  const version = match[1];
  return { version, tag: `v${version}` };
}

async function updateVersion(version: string): Promise<void> {
  console.log("Updating version in deno.json...");
  const configPath = new URL("../deno.json", import.meta.url);
  const content = await Deno.readTextFile(configPath);
  const config = JSON.parse(content);

  const oldVersion = config.version;
  config.version = version;

  await Deno.writeTextFile(
    configPath,
    JSON.stringify(config, null, 2) + "\n",
  );

  console.log(`✓ Updated version: ${oldVersion} -> ${version}`);
}

async function updateLock(): Promise<void> {
  console.log("Updating deno.lock...");
  const command = new Deno.Command("deno", {
    args: [
      "cache",
      "-r",
      "**/*.ts",
      "jsr:@probitas/probitas",
      "jsr:@probitas/probitas@^0",
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();
  if (code !== 0) {
    throw new Error("Failed to update deno.lock");
  }

  console.log("✓ Updated deno.lock");
}

async function updateFlakeLock(): Promise<void> {
  console.log("Updating flake.lock...");

  // Check if nix is available
  const nixCheck = new Deno.Command("which", {
    args: ["nix"],
    stdout: "null",
    stderr: "null",
  });

  const { code: nixCode } = await nixCheck.output();
  if (nixCode !== 0) {
    console.log("⊘ Skipping flake.lock update (nix not available)");
    return;
  }

  const command = new Deno.Command("nix", {
    args: ["flake", "update"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();
  if (code !== 0) {
    throw new Error("Failed to update flake.lock");
  }

  console.log("✓ Updated flake.lock");
}

async function createReleasePR(
  version: string,
  tag: string,
  skipPR: boolean,
): Promise<void> {
  if (skipPR) {
    console.log("\n⊘ Skipping PR creation (--skip-pr specified)");
    console.log("You can manually create a PR with:");
    console.log(`  git checkout -b release/${tag}`);
    console.log(`  git add deno.json deno.lock flake.lock`);
    console.log(`  git commit -m "chore: bump version to ${version}"`);
    console.log(`  git push origin release/${tag}`);
    console.log(`  gh pr create --base main --head release/${tag}`);
    return;
  }

  console.log("\nCreating release PR...");
  const branch = `release/${tag}`;

  // Configure git (only in CI environment)
  const isCI = Deno.env.get("CI") === "true";
  if (isCI) {
    const gitConfigName = new Deno.Command("git", {
      args: ["config", "user.name", "github-actions[bot]"],
    });
    const { code: gitConfigNameCode } = await gitConfigName.output();
    if (gitConfigNameCode !== 0) {
      throw new Error("Failed to configure git user.name");
    }

    const gitConfigEmail = new Deno.Command("git", {
      args: [
        "config",
        "user.email",
        "github-actions[bot]@users.noreply.github.com",
      ],
    });
    const { code: gitConfigEmailCode } = await gitConfigEmail.output();
    if (gitConfigEmailCode !== 0) {
      throw new Error("Failed to configure git user.email");
    }
  }

  // Create and checkout branch
  const checkout = new Deno.Command("git", {
    args: ["checkout", "-b", branch],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code: checkoutCode } = await checkout.output();
  if (checkoutCode !== 0) {
    throw new Error("Failed to create branch");
  }

  // Add files
  const add = new Deno.Command("git", {
    args: ["add", "deno.json", "deno.lock", "flake.lock"],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code: addCode } = await add.output();
  if (addCode !== 0) {
    throw new Error("Failed to add files");
  }

  // Commit
  const commit = new Deno.Command("git", {
    args: ["commit", "-m", `chore: bump version to ${version}`],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code: commitCode } = await commit.output();
  if (commitCode !== 0) {
    throw new Error("Failed to commit");
  }

  // Configure remote URL with token (in CI environment)
  if (isCI) {
    const ghToken = Deno.env.get("GH_TOKEN");
    if (!ghToken) {
      throw new Error("GH_TOKEN environment variable is required in CI");
    }

    // Get the current remote URL to extract repo path
    const getRemote = new Deno.Command("git", {
      args: ["remote", "get-url", "origin"],
      stdout: "piped",
      stderr: "inherit",
    });
    const { code: getRemoteCode, stdout } = await getRemote.output();
    if (getRemoteCode !== 0) {
      throw new Error("Failed to get remote URL");
    }

    const remoteUrl = new TextDecoder().decode(stdout).trim();
    // Extract owner/repo from URL (handles both HTTPS and git@ formats)
    // Match exactly two path segments (owner and repo)
    const repoMatch = remoteUrl.match(
      /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/,
    );
    if (!repoMatch) {
      throw new Error(`Could not extract repo path from URL: ${remoteUrl}`);
    }

    const repoPath = repoMatch[1];
    const authenticatedUrl =
      `https://x-access-token:${ghToken}@github.com/${repoPath}`;

    // Temporarily set the authenticated remote URL
    const setUrl = new Deno.Command("git", {
      args: ["remote", "set-url", "origin", authenticatedUrl],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { code: setUrlCode } = await setUrl.output();
    if (setUrlCode !== 0) {
      throw new Error("Failed to set authenticated remote URL");
    }

    try {
      // Push with authenticated URL
      const push = new Deno.Command("git", {
        args: ["push", "origin", branch],
        stdout: "inherit",
        stderr: "inherit",
      });
      const { code: pushCode } = await push.output();
      if (pushCode !== 0) {
        throw new Error("Failed to push branch");
      }
    } finally {
      // Restore the original remote URL to avoid leaving the token in git config
      const resetUrl = new Deno.Command("git", {
        args: ["remote", "set-url", "origin", remoteUrl],
        stdout: "inherit",
        stderr: "inherit",
      });
      await resetUrl.output();
    }
  } else {
    // Push without authentication (local environment)
    const push = new Deno.Command("git", {
      args: ["push", "origin", branch],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { code: pushCode } = await push.output();
    if (pushCode !== 0) {
      throw new Error("Failed to push branch");
    }
  }

  // Create PR
  const prBody = `## Summary
- Update version to ${version} in deno.json
- Update deno.lock to reflect new version
- Update flake.lock with latest dependencies

## Test plan
- [ ] CI checks pass (verify, scenario-test, scenario-test-nix)
- [ ] Ready to merge and trigger publish workflow`;

  const pr = new Deno.Command("gh", {
    args: [
      "pr",
      "create",
      "--title",
      `chore: bump version to ${version}`,
      "--body",
      prBody,
      "--base",
      "main",
      "--head",
      branch,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code: prCode } = await pr.output();
  if (prCode !== 0) {
    throw new Error("Failed to create PR");
  }

  console.log(`✓ Created PR for release/${tag}`);
}

if (import.meta.main) {
  const args = Deno.args;
  const skipPR = args.includes("--skip-pr");
  const versionInput = args.find((arg) => !arg.startsWith("--"));

  if (!versionInput) {
    console.error("Usage: deno task release <version> [--skip-pr]");
    console.error("Example: deno task release v1.2.3");
    console.error("         deno task release v1.2.3 --skip-pr");
    Deno.exit(1);
  }

  try {
    const { version, tag } = parseVersion(versionInput);

    console.log(`Preparing release for ${tag}...\n`);

    await updateVersion(version);
    await updateLock();
    await updateFlakeLock();
    await createReleasePR(version, tag, skipPR);

    console.log(`\n✓ Release preparation complete!`);
  } catch (error) {
    console.error(
      `\n✗ Error: ${error instanceof Error ? error.message : error}`,
    );
    Deno.exit(1);
  }
}
