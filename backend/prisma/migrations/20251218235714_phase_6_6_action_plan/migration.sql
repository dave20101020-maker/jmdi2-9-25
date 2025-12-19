-- CreateTable
CREATE TABLE "action_plan" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "doc" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "action_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_plan_user_id_idx" ON "action_plan"("user_id");
