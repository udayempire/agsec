import type { HttpSendArgs } from "@repo/shared";

export type SimulatedHttpResult = {
  simulated: true;
  method: HttpSendArgs["method"];
  host: string;
  status: 202;
  payloadBytes: number;
};

export function sendSimulatedHttp(args: HttpSendArgs): SimulatedHttpResult {
  return {
    simulated: true,
    method: args.method,
    host: new URL(args.url).hostname,
    status: 202,
    payloadBytes: new TextEncoder().encode(args.body ?? "").byteLength,
  };
}
