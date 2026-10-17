import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ResolvedSandboxPath = {
    inputPath: string;
    absolutePath: string;
    relativePath: string;
    pathClass: "public" | "secret" | "unknown";
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX_ROOT = path.resolve(MODULE_DIR, "../../sandbox");

function isInside(root: string, target: string): boolean {
    const relative = path.relative(root, target);
  
    return (
      relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative))
    );
};

function classifyPath(
    relativePath: string,
  ): ResolvedSandboxPath["pathClass"] {
    const normalized = relativePath.split(path.sep).join("/");
  
    if (normalized.startsWith("public/")) return "public";
    if (normalized.startsWith("secrets/")) return "secret";
  
    return "unknown";
};


    export async function resolveSandboxPath(inputPath: string): Promise<ResolvedSandboxPath> {
        if (
        path.isAbsolute(inputPath) ||
        path.win32.isAbsolute(inputPath)
    ) {
        throw new Error("Absolute paths are not allowed.");
    }

    const normalizedInput = path.normalize(inputPath);

    const sandboxRoot = await realpath(SANDBOX_ROOT);

    const requestedPath = path.resolve(
        sandboxRoot,
        normalizedInput,
    );

    const parentPath = path.dirname(requestedPath);

    // Resolve the parent to detect symlink-based directory escapes.
    const realParent = await realpath(parentPath);

    if (!isInside(sandboxRoot, realParent)) {
        throw new Error("Path escapes the sandbox.");
    }

    // Check whether the target exists, including dangling symlinks.
    let targetExists = true;

    try {
        await lstat(requestedPath);
    } catch (error) {
        if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
        ) {
        targetExists = false;
        } else {
        throw error;
        }
    }

    let absolutePath: string;

    if (targetExists) {
        // Resolve symlinks on the target itself.
        absolutePath = await realpath(requestedPath);

        if (!isInside(sandboxRoot, absolutePath)) {
        throw new Error("Target escapes the sandbox.");
        }
    } else {
        // Preserve the intended target path under its canonical parent.
        absolutePath = path.join(realParent, path.basename(requestedPath));
    }

    const relativePath = path.relative(
        sandboxRoot,
        absolutePath,
    );

    if (
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error("Resolved path escapes the sandbox.");
    }

    return {
        inputPath,
        absolutePath,
        relativePath,
        pathClass: classifyPath(relativePath),
    };
    };


// how it works

// rejects empty paths, NUL bytes, and absolute paths.
// resolves the actual filesystem location of apps/api/sandbox/
// prevents directory symlinks from escaping the sandbox
// resolves existing targets to detect symlink escapes, including dangling symlinks being rejected.
// identifies canonical paths under public/ and secrets/; everything else is unknown.