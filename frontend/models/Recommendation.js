import mongoose from "mongoose";

const RecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  recommendedItems: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Recommendation || mongoose.model("Recommendation", RecommendationSchema);
