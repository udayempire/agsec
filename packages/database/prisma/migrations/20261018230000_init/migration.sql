-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ToolName" AS ENUM ('read_file', 'write_file', 'list_dir', 'http_send', 'run_command');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('ALLOW', 'BLOCK', 'REQUIRE_APPROVAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "eventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tool" "ToolName" NOT NULL,
    "decision" "Decision" NOT NULL,
    "severity" "Severity" NOT NULL,
    "matchedRules" JSONB NOT NULL DEFAULT '[]',
    "reason" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "resourcePath" TEXT,
    "resourceClass" TEXT,
    "payloadBytes" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "PolicySet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "policySetId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tool" TEXT NOT NULL,
    "effect" "Decision" NOT NULL,
    "severity" "Severity" NOT NULL,
    "match" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentSession_sessionId_key" ON "AgentSession"("sessionId");

-- CreateIndex
CREATE INDEX "AgentSession_startedAt_idx" ON "AgentSession"("startedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_decision_timestamp_idx" ON "AuditEvent"("decision", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_sessionId_timestamp_idx" ON "AuditEvent"("sessionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_sessionId_seq_key" ON "AuditEvent"("sessionId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_sessionId_idempotencyKey_key" ON "AuditEvent"("sessionId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PolicySet_ownerId_enabled_idx" ON "PolicySet"("ownerId", "enabled");

-- CreateIndex
CREATE INDEX "PolicySet_updatedAt_idx" ON "PolicySet"("updatedAt");

-- CreateIndex
CREATE INDEX "PolicyRule_policySetId_position_idx" ON "PolicyRule"("policySetId", "position");

-- CreateIndex
CREATE INDEX "PolicyRule_tool_enabled_idx" ON "PolicyRule"("tool", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_policySetId_ruleId_key" ON "PolicyRule"("policySetId", "ruleId");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_policySetId_fkey" FOREIGN KEY ("policySetId") REFERENCES "PolicySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
