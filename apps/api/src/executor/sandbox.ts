import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

export type SandboxPathClass = "public" | "secret" | "unknown";

export type ResolvedSandboxPath = {
  inputPath: string;
  absolutePath: string;
  relativePath: string;
  pathClass: SandboxPathClass;
};

const SANDBOX_ROOT = path.resolve(import.meta.dir, "../../sandbox");
const REAL_SANDBOX_ROOT = await realpath(SANDBOX_ROOT);

export function getSandboxRoot(): string {
  return REAL_SANDBOX_ROOT;
}

export async function resolveSandboxPath(
  inputPath: string,
): Promise<ResolvedSandboxPath> {
  rejectUnsafeInput(inputPath);

  const normalizedInput = path.normalize(inputPath);
  const requestedPath = path.resolve(REAL_SANDBOX_ROOT, normalizedInput);
  const parentPath = path.dirname(requestedPath);

  let realParent: string;
  try {
    realParent = await realpath(parentPath);
  } catch {
    throw new Error("Target parent path does not exist");
  }

  if (!isInsideSandbox(realParent, REAL_SANDBOX_ROOT)) {
    throw new Error("Path escapes sandbox");
  }

  const targetExists = await pathExists(requestedPath);
  const absolutePath = targetExists
    ? await resolveExistingTarget(requestedPath)
    : path.join(realParent, path.basename(requestedPath));

  if (!isInsideSandbox(absolutePath, REAL_SANDBOX_ROOT)) {
    throw new Error("Resolved path escapes sandbox");
  }

  const relativePath = path.relative(REAL_SANDBOX_ROOT, absolutePath);

  if (relativePath === "" || !isSafeRelativePath(relativePath)) {
    throw new Error("Resolved path escapes sandbox");
  }

  return {
    inputPath,
    absolutePath,
    relativePath,
    pathClass: classifySandboxPath(relativePath),
  };
}

//remove unsafe input or paths.
function rejectUnsafeInput(inputPath: string): void {
  if (inputPath.trim().length === 0) {
    throw new Error("Sandbox path cannot be empty");
  }

  if (inputPath.includes("\0")) {
    throw new Error("NUL bytes are not allowed in sandbox paths");
  }

  if (path.isAbsolute(inputPath) || path.win32.isAbsolute(inputPath)) {
    throw new Error("Absolute paths are not allowed.");
  }
}

// Resolves the target's real path and rejects dangling symlinks or sandbox escapes.
async function resolveExistingTarget(requestedPath: string): Promise<string> {
  try {
    const realTarget = await realpath(requestedPath);

    if (!isInsideSandbox(realTarget, REAL_SANDBOX_ROOT)) {
      throw new Error("Symlink escapes sandbox");
    }

    return realTarget;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error("Target symlink is dangling or cannot be resolved");
    }

    throw error;
  }
}

async function pathExists(candidatePath: string): Promise<boolean> {
  try {
    await lstat(candidatePath);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isInsideSandbox(candidatePath: string, sandboxRoot: string): boolean {
  const relativePath = path.relative(sandboxRoot, candidatePath);
  return isSafeRelativePath(relativePath) || relativePath === "";
}

function isSafeRelativePath(relativePath: string): boolean {
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function classifySandboxPath(relativePath: string): SandboxPathClass {
  const normalized = relativePath.split(path.sep).join("/");

  if (normalized === "public" || normalized.startsWith("public/")) {
    return "public";
  }

  if (normalized === "secrets" || normalized.startsWith("secrets/")) {
    return "secret";
  }

  return "unknown";
}
