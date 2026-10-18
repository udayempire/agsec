import { resolveSandboxPath, type SandboxPathClass } from "../sandbox";

const MAX_READ_BYTES = 64 * 1024;

export type ReadFileResult = {
  path: string;
  pathClass: Exclude<SandboxPathClass, "unknown">;
  content: string;
  bytes: number;
};

// Reads only files that resolve inside the sandbox and are not protected secrets.
export async function readSandboxFile(inputPath: string): Promise<ReadFileResult> {
  const resolved = await resolveSandboxPath(inputPath);

  if (resolved.pathClass === "unknown") {
    throw new Error("Access denied: file is outside allowed sandbox directories");
  }

  // Defense in depth: policy should block this before execution, but the tool
  // refuses to read protected secrets even if it is called incorrectly.
  if (resolved.pathClass === "secret") {
    throw new Error("Access denied: secret files cannot be read");
  }

  const file = Bun.file(resolved.absolutePath);

  if (!(await file.exists())) {
    throw new Error("Sandbox file does not exist");
  }

  if (file.size > MAX_READ_BYTES) {
    throw new Error("Sandbox file exceeds maximum readable size");
  }

  const content = await file.text();

  return {
    path: resolved.relativePath,
    pathClass: resolved.pathClass,
    content,
    bytes: file.size,
  };
}
