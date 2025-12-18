-- CreateTable
CREATE TABLE "onboarding_profile" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "doc" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "onboarding_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profile_user_id_key" ON "onboarding_profile"("user_id");

-- CreateIndex
CREATE INDEX "onboarding_profile_user_id_idx" ON "onboarding_profile"("user_id");
