import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  cuisine: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  popularity: { type: Number, default: 0 },
  dietaryTags: [{ type: String }],
  restaurantId: { type: mongoose.Schema.Types.ObjectId }
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);