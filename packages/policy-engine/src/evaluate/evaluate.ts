// Decides whether a tool call should be allowed, blocked, or requires approval based on a policy set.

import type {
    Decision,
    HttpSendArgs,
    PolicyRule,
    PolicySet,
    PolicyVerdict,
    RunCommandArgs,
    ToolCallRequest,
} from "@repo/shared";

export type ResourceContext = {
    pathClass?: string;
};

export type EvaluationContext = {
    resource?: ResourceContext;
};

const DECISION_RANK: Record<Decision, number> = {
    ALLOW: 1,
    REQUIRE_APPROVAL: 2,
    BLOCK: 3,
};

const SEVERITY_RANK: Record<PolicyVerdict["severity"], number> = {
    info: 1,
    low: 2,
    medium: 3,
    high: 4,
    critical: 5,
};

/**
 * Evaluates a tool call against a policy set and returns a policy verdict.
 * @param request - The tool call request to evaluate.
 * @param policy - The policy set to evaluate the request against.
 * @param context - The evaluation context to use.
 * @returns The policy verdict for the request.
 */

export function evaluatePolicy(
    request: ToolCallRequest,
    policy: PolicySet,
    context: EvaluationContext = {},
): PolicyVerdict {
    const matchedRules: PolicyRule[] = [];

    for (const rule of policy.rules) {
        if (!rule.enabled) continue;
        if (rule.tool !== "*" && rule.tool !== request.tool) continue;

        if (matchesRule(rule, request, context)) {
            matchedRules.push(rule);
        }
    }

    if (matchedRules.length === 0) {
        return {
            decision: "BLOCK",
            severity: "medium",
            matchedRules: ["DEFAULT-DENY"],
            reason: "No allow rule matched this tool call.",
        };
    }

    const winningRule = pickWinningRule(matchedRules);

    return {
        decision: winningRule.effect,
        severity: winningRule.severity,
        matchedRules: matchedRules.map((rule) => rule.id),
        reason: winningRule.description,
    };
}

function matchesRule(
    rule: PolicyRule,
    request: ToolCallRequest,
    context: EvaluationContext,
): boolean {
    const match = rule.match;

    switch (match.type) {
        case "path_class": {
            return context.resource?.pathClass === match.pathClass;
        }

        case "allowed_hosts": {
            if (request.tool !== "http_send") return false;

            const args = request.args as HttpSendArgs;
            const host = safeHost(args.url);

            if (!host) return true;

            return !match.destinations.includes(host);
        }

        case "dangerous_command": {
            if (request.tool !== "run_command") return false;

            const args = request.args as RunCommandArgs;
            const argv = args.argv.map((part) => part.toLowerCase());

            return match.patterns.some((pattern) =>
                argv.some((arg) => arg === pattern.toLowerCase()),
            );
        }

        case "tool_denied": {
            return true;
        }

        case "sequence": {
            // Sequence rules need session history and are handled later by the
            // sequence detector, not this pure stateless evaluator.
            return false;
        }
    }
}

// Picks the winning rule from a list of rules based on the decision and severity.
function pickWinningRule(rules: PolicyRule[]): PolicyRule {
    return rules.toSorted((a, b) => {
        const decisionDelta =
            DECISION_RANK[b.effect] - DECISION_RANK[a.effect];

        if (decisionDelta !== 0) {
            return decisionDelta;
        }

        return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    })[0]!;
}
//   extracts hostname from a URL.  
function safeHost(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
