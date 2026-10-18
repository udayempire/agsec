import { ReadFileArgsSchema } from "@repo/shared";
import type { AuthorizedAction } from "../gateway/authorize";
import { readSandboxFile } from "./tools/read-file";

export async function runAuthorizedAction(action: AuthorizedAction): Promise<unknown> {
  switch (action.tool) {
    case "read_file": {
      const args = ReadFileArgsSchema.parse(action.args);
      return await readSandboxFile(args.path);
    }

    default:
      throw new Error(`Unsupported authorized tool: ${action.tool}`);
  }
}
