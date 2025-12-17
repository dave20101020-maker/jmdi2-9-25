-- CreateTable
CREATE TABLE "pillar" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consent_event" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "consent_type" TEXT NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consent_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pillar_identifier_key" ON "pillar"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "pillar_display_name_key" ON "pillar"("display_name");

-- CreateIndex
CREATE INDEX "pillar_is_active_display_order_idx" ON "pillar"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "user_consent_event_user_type_captured_at_desc_idx" ON "user_consent_event"("user_id", "consent_type", "captured_at" DESC);
