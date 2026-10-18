import {
  HttpSendArgsSchema,
  ReadFileArgsSchema,
  RunCommandArgsSchema,
} from "@repo/shared";
import type { AuthorizedAction } from "../gateway/authorize";
import { sendSimulatedHttp } from "./tools/http-send";
import { readSandboxFile } from "./tools/read-file";
import { runSimulatedCommand } from "./tools/run-command";

export async function runAuthorizedAction(action: AuthorizedAction): Promise<unknown> {
  switch (action.tool) {
    case "read_file": {
      const args = ReadFileArgsSchema.parse(action.args);
      return await readSandboxFile(args.path);
    }

    case "run_command": {
      const args = RunCommandArgsSchema.parse(action.args);
      return runSimulatedCommand(args);
    }

    case "http_send": {
      const args = HttpSendArgsSchema.parse(action.args);
      return sendSimulatedHttp(args);
    }

    default:
      throw new Error(`Unsupported authorized tool: ${action.tool}`);
  }
}
