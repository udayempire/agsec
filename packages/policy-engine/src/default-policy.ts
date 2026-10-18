import type { PolicySet } from "@repo/shared";

export const defaultPolicy: PolicySet = {
    version: 1,
    rules: [
        {
            id: "FILE-001",
            enabled: true,
            tool: "read_file",
            effect: "BLOCK",
            severity: "high",
            description: "Block reads from protected secret file paths.",
            match: {
                type: "path_class",
                pathClass: "secret",
            },
        },
        {
            id: "FILE-002",
            enabled: true,
            tool: "write_file",
            effect: "BLOCK",
            severity: "high",
            description: "Block writes to protected secret file paths.",
            match: {
                type: "path_class",
                pathClass: "secret",
            },
        },
        {
            id: "FILE-ALLOW-001",
            enabled: true,
            tool: "read_file",
            effect: "ALLOW",
            severity: "info",
            description: "Allow reads from public sandbox files.",
            match: {
              type: "path_class",
              pathClass: "public",
            },
          },          
        {
            id: "NET-001",
            enabled: true,
            tool: "http_send",
            effect: "BLOCK",
            severity: "high",
            description: "Block outbound HTTP requests to non-allowlisted destinations.",
            match: {        
                type: "allowed_hosts",
                destinations: [
                    "api.github.com",
                    "registry.npmjs.org",
                    "localhost",
                ],
            },
        },
        {
            id: "NET-ALLOW-001",
            enabled: true,
            tool: "http_send",
            effect: "ALLOW",
            severity: "info",
            description: "Allow simulated HTTP requests to approved destinations.",
            match: {
                type: "allowed_hosts",
                destinations: [
                    "api.github.com",
                    "registry.npmjs.org",
                    "localhost",
                ],
            },
        },
        {
            id: "CMD-001",
            enabled: true,
            tool: "run_command",
            effect: "BLOCK",
            severity: "critical",
            description: "Block dangerous shell-like command execution patterns.",
            match: {
                type: "dangerous_command",
                patterns: [
                    "rm",
                    "curl",
                    "wget",
                    "nc",
                    "netcat",
                    "ssh",
                    "scp",
                    "chmod",
                    "chown",
                    "sudo",
                    "bash",
                    "sh",
                    "zsh",
                    "fish",
                ],
            },
        },
        {
            id: "CMD-ALLOW-001",
            enabled: true,
            tool: "run_command",
            effect: "ALLOW",
            severity: "info",
            description: "Allow safe commands through the simulated command executor.",
            match: {
                type: "safe_command",
                blockedPatterns: [
                    "rm", "curl", "wget", "nc", "netcat", "ssh", "scp",
                    "chmod", "chown", "sudo", "bash", "sh", "zsh", "fish",
                ],
            },
        },
        {
            id: "SEQ-001",
            enabled: true,
            tool: "http_send",
            effect: "BLOCK",
            severity: "critical",
            description:
                "Block egress after sensitive file access within the same agent session.",
            match: {
                type: "sequence",
                steps: [
                    {
                        tool: "read_file",
                        pathClass: "secret",
                    },
                    {
                        tool: "http_send",
                    },
                ],
                window: 30 * 60 * 1000,
            },
        },
    ]
}
