-- CreateTable
CREATE TABLE "ai_message" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_message_user_time_idx" ON "ai_message"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_message_session_idx" ON "ai_message"("session_id");
