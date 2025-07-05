import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Restaurant name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  path: {  // Add this field
    type: String,
    required: true
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  image: {
    type: String,
    trim: true
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug before saving
RestaurantSchema.pre('save', async function(next) {
  if (!this.isModified('name')) return next();
  
  let slug = this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure slug is unique
  const slugRegex = new RegExp(`^(${slug})((-[0-9]*$)?)$`, 'i');
  const restaurantsWithSlug = await this.constructor.find({ slug: slugRegex });
  
  if (restaurantsWithSlug.length) {
    slug = `${slug}-${restaurantsWithSlug.length + 1}`;
  }

  this.slug = slug;
  this.path = slug; // Set path to be same as slug
  next();
});

export default mongoose.models.Restaurant || 
       mongoose.model("Restaurant", RestaurantSchema);