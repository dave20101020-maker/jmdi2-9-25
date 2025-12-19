-- CreateTable
CREATE TABLE "user_core_state" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "allowed_pillars" JSONB,
    "pillars" JSONB,
    "settings" JSONB,
    "subscription_tier" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_core_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_core_state_user_id_key" ON "user_core_state"("user_id");

-- CreateIndex
CREATE INDEX "user_core_state_user_id_idx" ON "user_core_state"("user_id");
