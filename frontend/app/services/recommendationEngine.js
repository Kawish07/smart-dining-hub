// app/services/recommendationEngine.js
import Order from "@/models/Order";
import OrderHistory from "@/models/OrderHistory";
// Instead of Product, use Item which is in your models folder
import Item from "@/models/Item";
import mongoose from "mongoose";

class RecommendationEngine {
  async getRecommendationsForUser(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      // Get the user's order history
      const userOrders = await Order.find({ user: userId })
        .populate('items.item')
        .lean();
      
      if (!userOrders || userOrders.length === 0) {
        // If no orders, return popular items
        return await this.getPopularItems();
      }
      
      // Extract items that the user has ordered
      const orderedItems = [];
      const orderedCategories = new Set();
      
      userOrders.forEach(order => {
        order.items.forEach(orderItem => {
          if (orderItem.item) {
            orderedItems.push(orderItem.item._id);
            if (orderItem.item.category) {
              orderedCategories.add(orderItem.item.category.toString());
            }
          }
        });
      });
      
      // Get similar items based on categories
      let recommendations = [];
      
      if (orderedCategories.size > 0) {
        recommendations = await Item.find({
          category: { $in: Array.from(orderedCategories) },
          _id: { $nin: orderedItems } // Exclude items user already ordered
        })
        .populate('category')
        .limit(10)
        .lean();
      }
      
      // If we don't have enough recommendations, add some popular items
      if (recommendations.length < 5) {
        const popularItems = await this.getPopularItems(10 - recommendations.length);
        
        // Make sure we don't add duplicates
        const recommendationIds = new Set(recommendations.map(item => item._id.toString()));
        
        for (const item of popularItems) {
          if (!recommendationIds.has(item._id.toString()) && 
              !orderedItems.includes(item._id.toString())) {
            recommendations.push(item);
          }
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error("Error in getRecommendationsForUser:", error);
      throw error;
    }
  }
  
  async getPopularItems(limit = 10) {
    try {
      // Get the most ordered items
      const orderData = await Order.aggregate([
        { $unwind: "$items" },
        { $group: {
            _id: "$items.item",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      
      // Get the actual items
      const itemIds = orderData.map(item => item._id);
      
      const popularItems = await Item.find({
        _id: { $in: itemIds }
      })
      .populate('category')
      .lean();
      
      // Sort them in the original order of popularity
      const itemIdMap = new Map();
      popularItems.forEach(item => {
        itemIdMap.set(item._id.toString(), item);
      });
      
      return orderData
        .map(data => itemIdMap.get(data._id.toString()))
        .filter(Boolean);
    } catch (error) {
      console.error("Error in getPopularItems:", error);
      return [];
    }
  }
}

export default RecommendationEngine;