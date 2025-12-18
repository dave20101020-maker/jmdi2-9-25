-- CreateEnum
CREATE TYPE "PillarScoreTrend" AS ENUM ('improving', 'stable', 'declining');

-- CreateTable
CREATE TABLE "pillar_check_in" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "pillar_identifier" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pillar_check_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pillar_score" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "pillar_identifier" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "trend" "PillarScoreTrend" NOT NULL DEFAULT 'stable',
    "weekly_scores" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "monthly_scores" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "quick_wins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pillar_score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pillar_check_in_user_id_idx" ON "pillar_check_in"("user_id");

-- CreateIndex
CREATE INDEX "pillar_check_in_pillar_identifier_idx" ON "pillar_check_in"("pillar_identifier");

-- CreateIndex
CREATE INDEX "pillar_check_in_user_created_at_desc_idx" ON "pillar_check_in"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pillar_check_in_user_pillar_created_at_desc_idx" ON "pillar_check_in"("user_id", "pillar_identifier", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pillar_score_user_id_idx" ON "pillar_score"("user_id");

-- CreateIndex
CREATE INDEX "pillar_score_pillar_identifier_idx" ON "pillar_score"("pillar_identifier");

-- CreateIndex
CREATE INDEX "pillar_score_user_pillar_updated_at_desc_idx" ON "pillar_score"("user_id", "pillar_identifier", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pillar_score_user_pillar_unique" ON "pillar_score"("user_id", "pillar_identifier");
