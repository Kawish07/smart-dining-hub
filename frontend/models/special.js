// models/Special.js
import mongoose from "mongoose";

// Define the schema for special dishes
const SpecialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for the special dish"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description for the special dish"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide a price for the special dish"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      default: "",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide a restaurant ID"],
      ref: "Restaurant",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,  // Make it optional
      validate: {
        validator: function(v) {
          // Allow null/undefined or valid ObjectId
          return v === null || v === undefined || mongoose.Types.ObjectId.isValid(v);
        },
        message: props => `${props.value} is not a valid category ID!`
      }
    },
    prepTime: {
      type: Number,
      min: [0, "Preparation time cannot be negative"],
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    chefRecommended: {
      type: Boolean,
      default: false,
    },
    awardWinning: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: []
    },
    featured: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.Special || mongoose.model("Special", SpecialSchema);