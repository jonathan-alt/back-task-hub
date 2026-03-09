-- Migration: TaskHub → Jira Simplificado
-- Transforma o modelo de dados de tasks simples para kanban com organizações

BEGIN;

-- 1. Criar enum TaskStatus
CREATE TYPE "TaskStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'DONE');

-- 2. Criar tabela Organization
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Organization_accessKey_key" ON "Organization"("accessKey");

-- 3. Criar tabela OrganizationMember
CREATE TABLE "OrganizationMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- 4. Transformar tabela Task
-- Adicionar novas colunas
ALTER TABLE "Task" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'WAITING';
ALTER TABLE "Task" ADD COLUMN "deadline" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "authorId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "assigneeId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "organizationId" INTEGER;

-- Migrar dados existentes
UPDATE "Task" SET "authorId" = "userId", "assigneeId" = "userId";
UPDATE "Task" SET "status" = 'DONE' WHERE "done" = true;

-- Tornar NOT NULL após migração de dados
ALTER TABLE "Task" ALTER COLUMN "authorId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "assigneeId" SET NOT NULL;

-- Remover colunas antigas
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_userId_fkey";
ALTER TABLE "Task" DROP COLUMN "done";
ALTER TABLE "Task" DROP COLUMN "userId";

-- Adicionar foreign keys
ALTER TABLE "Task" ADD CONSTRAINT "Task_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remover relação antiga do User
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "Task_userId_fkey";

COMMIT;
