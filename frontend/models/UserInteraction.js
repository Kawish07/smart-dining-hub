import mongoose from 'mongoose';

const UserInteractionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { 
    type: String, 
    enum: [
      'viewed',
      'added_to_cart',
      'ordered',
      'liked_recommendation',
      'disliked_recommendation',
      'added_to_cart_from_recommendation'
    ],
    required: true 
  },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.UserInteraction || mongoose.model('UserInteraction', UserInteractionSchema);