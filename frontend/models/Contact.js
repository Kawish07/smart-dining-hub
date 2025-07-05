// models/Contact.js
import mongoose from "mongoose";

// Define the schema for the contact form data
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"], // Name is required
      trim: true, // Remove extra spaces
    },
    email: {
      type: String,
      required: [true, "Email is required"], // Email is required
      trim: true,
      lowercase: true, // Convert email to lowercase
      match: [/.+\@.+\..+/, "Please enter a valid email address"], // Validate email format
    },
    message: {
      type: String,
      required: [true, "Message is required"], // Message is required
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
  }
);

// Create the model
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;