
import { ReadFileArgsSchema } from "@repo/shared";
import { readSandboxFile } from "./tools/read-file";

export type AuthorizedAction = {
    tool: string;
    args: unknown;
};

export async function runAuthorizedAction(
    action: AuthorizedAction,
  ) {
    switch (action.tool) {
      case "read_file": {
        const args = ReadFileArgsSchema.parse(action.args);
        return await readSandboxFile(args.path);
      }
  
      default:
        throw new Error(`Unsupported tool: ${action.tool}`);
    }
}

// Accepts an authorized action.
// Validates the read_file arguments using the shared Zod schema.
// Calls readSandboxFile.
// Rejects unsupported tools.