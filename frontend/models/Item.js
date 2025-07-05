import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  // Support both string categories and ObjectId references
  category: {
    type: mongoose.Schema.Types.Mixed, // This allows for either String or ObjectId
    required: true
  },
  restaurantId: {  // Using restaurantId to match your DB
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Restaurant'
  },
  image: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;