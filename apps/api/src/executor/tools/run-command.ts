import type { RunCommandArgs } from "@repo/shared";

export type SimulatedCommandResult = {
  simulated: true;
  argv: RunCommandArgs["argv"];
  command: string;
  exitCode: 0;
};

export function runSimulatedCommand(args: RunCommandArgs): SimulatedCommandResult {
  return {
    simulated: true,
    argv: [...args.argv],
    command: args.argv.join(" "),
    exitCode: 0,
  };
}
