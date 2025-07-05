// lib/cronJobs.js
import RecommendationEngine from "@/services/recommendationEngine";
import { connectToDb } from "@/lib/mongodb";
import cron from 'node-cron';

export function setupCronJobs() {
  // Update recommendation models daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily recommendation model update...');
    try {
      await connectToDb();
      await RecommendationEngine.updateModels();
      console.log('Recommendation models updated successfully');
    } catch (error) {
      console.error('Model update error:', error);
    }
  });
}