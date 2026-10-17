
import { z } from "zod";

// Enums 

export const ToolNameSchema = z.enum([
  "read_file",
  "write_file",
  "list_dir",
  "http_send",
  "run_command",
]);

export const DecisionSchema = z.enum([
  "ALLOW",
  "BLOCK",
  "REQUIRE_APPROVAL",
]);

export const SeveritySchema = z.enum([
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

// Tool argument schemas 

export const ReadFileArgsSchema = z
  .object({
    path: z.string().min(1),
  })
  .strict();

export const WriteFileArgsSchema = z
  .object({
    path: z.string().min(1),
    content: z.string(),
  })
  .strict();

export const ListDirArgsSchema = z
  .object({
    path: z.string().min(1),
  })
  .strict();

export const HttpSendArgsSchema = z
  .object({
    url: z.string().url(),
    method: HttpMethodSchema,
    body: z.string().optional(),
  })
  .strict();

export const RunCommandArgsSchema = z
  .object({
    argv: z.array(z.string()).min(1),
  })
  .strict();

// Tool call request 

export const ToolCallRequestSchema = z
  .object({
    sessionId: z.string().min(1),
    seq: z.number().int().nonnegative(),
    idempotencyKey: z.string().min(1), // prevents duplicate tool calls
    tool: ToolNameSchema,
    args: z.unknown(),
  })
  .strict()
  .superRefine((request, ctx) => {
    const schemas = {
      read_file: ReadFileArgsSchema,
      write_file: WriteFileArgsSchema,
      list_dir: ListDirArgsSchema,
      http_send: HttpSendArgsSchema,
      run_command: RunCommandArgsSchema,
    } as const;

    const result = schemas[request.tool].safeParse(request.args);

    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["args", ...issue.path],
        });
      }
    }
  });

// Policy match schemas 

export const PathClassMatchSchema = z
  .object({
    type: z.literal("path_class"),
    pathClass: z.string().min(1),
    path: z.string().min(1).optional(),
  })
  .strict();

export const AllowedHosts = z
  .object({
    type: z.literal("allowed_hosts"),
    destinations: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const DangerousCommandMatchSchema = z
  .object({
    type: z.literal("dangerous_command"),
    patterns: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const ToolDeniedMatchSchema = z
  .object({
    type: z.literal("tool_denied"),
  })
  .strict();

export const SequenceMatchSchema = z
  .object({
    type: z.literal("sequence"),
    steps: z.array(
      z.object({
        tool: ToolNameSchema.optional(),
        pathClass: z.string().min(1).optional(),
        destination: z.string().min(1).optional(),
      }).strict(),
    ).min(2),
    window: z.number().int().positive().optional(),
  })
  .strict();

export const RuleMatchSchema = z.discriminatedUnion("type", [
  PathClassMatchSchema,
  AllowedHosts,
  DangerousCommandMatchSchema,
  ToolDeniedMatchSchema,
  SequenceMatchSchema,
]);

// Policy rule and policy set 

export const PolicyRuleToolSchema = z.union([
  ToolNameSchema,
  z.literal("*"),
]);

export const PolicyRuleSchema = z
  .object({
    id: z.string().min(1),
    enabled: z.boolean(),
    tool: PolicyRuleToolSchema,
    effect: DecisionSchema,
    severity: SeveritySchema,
    match: RuleMatchSchema,
    description: z.string().min(1),
  })
  .strict();

export const PolicySetSchema = z
  .object({
    version: z.number().int().positive(),
    rules: z.array(PolicyRuleSchema),
  })
  .strict();

// Decision output schemas

export const PolicyVerdictSchema = z
  .object({
    decision: DecisionSchema,
    severity: SeveritySchema,
    matchedRules: z.array(z.string()),
    reason: z.string().min(1),
  })
  .strict();

// Inferred TypeScript types

export type ToolName = z.infer<typeof ToolNameSchema>;
export type PolicyRuleTool = z.infer<typeof PolicyRuleToolSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Severity = z.infer<typeof SeveritySchema>;

export type ReadFileArgs = z.infer<typeof ReadFileArgsSchema>;
export type WriteFileArgs = z.infer<typeof WriteFileArgsSchema>;
export type ListDirArgs = z.infer<typeof ListDirArgsSchema>;
export type HttpSendArgs = z.infer<typeof HttpSendArgsSchema>;
export type RunCommandArgs = z.infer<typeof RunCommandArgsSchema>;

export type ToolCallRequest = z.infer<typeof ToolCallRequestSchema>;
export type RuleMatch = z.infer<typeof RuleMatchSchema>;
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;
export type PolicySet = z.infer<typeof PolicySetSchema>;
export type PolicyVerdict = z.infer<typeof PolicyVerdictSchema>;
