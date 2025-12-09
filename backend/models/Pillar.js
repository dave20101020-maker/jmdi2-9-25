import mongoose from "mongoose";

const pillarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pillar name is required"],
      unique: true,
      trim: true,
      enum: [
        "Sleep",
        "Diet",
        "Exercise",
        "Physical Health",
        "Mental Health",
        "Finance",
        "Social",
        "Spirituality",
      ],
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // e.g., 'sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "⭐",
    },
    color: {
      type: String,
      default: "#D4AF37",
    },
    category: {
      type: String,
      enum: ["physical", "mental", "lifestyle"],
      default: "lifestyle",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tips: [
      {
        type: String,
      },
    ],
    resources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ["article", "video", "tool", "course"],
        },
      },
    ],
    quickWins: {
      type: [String],
      default: [],
    },
    trendSummary: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
pillarSchema.index({ identifier: 1 });
pillarSchema.index({ name: 1 });
pillarSchema.index({ isActive: 1, order: 1 });

export default mongoose.model("Pillar", pillarSchema);
