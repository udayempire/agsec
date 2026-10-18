
import { describe, it, expect } from "bun:test";
import { resolveSandboxPath } from "../src/executor/sandbox";

describe("resolveSandboxPath", () => {
  it("resolves a public file", async () => {
    const result = await resolveSandboxPath("public/readme.txt");

    expect(result.pathClass).toBe("public");
    expect(result.relativePath).toBe("public/readme.txt");
  });

  it("resolves a secret file", async () => {
    const result = await resolveSandboxPath("secrets/.env.fake");

    expect(result.pathClass).toBe("secret");
  });

  it("classifies an unknown path", async () => {
    const result = await resolveSandboxPath("other/data.txt");

    expect(result.pathClass).toBe("unknown");
  });

  it("rejects absolute paths", async () => {
    await expect(
      resolveSandboxPath("/etc/passwd"),
    ).rejects.toThrow("Absolute paths are not allowed.");
  });

  it("rejects directory traversal", async () => {
    await expect(
      resolveSandboxPath("../../../../etc/passwd"),
    ).rejects.toThrow();
  });

  it("rejects empty paths", async () => {
    await expect(resolveSandboxPath("")).rejects.toThrow();
  });

  it("rejects NUL bytes", async () => {
    await expect(
      resolveSandboxPath("public/test\0.txt"),
    ).rejects.toThrow();
  });
});
