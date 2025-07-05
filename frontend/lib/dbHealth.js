import mongoose from "mongoose";

let isDatabaseHealthy = false;
let lastCheckTime = null;

export async function checkDatabaseHealth() {
  // Cache health status for 30 seconds
  if (lastCheckTime && Date.now() - lastCheckTime < 30000) {
    return isDatabaseHealthy;
  }

  try {
    // Test connection
    await mongoose.connection.db.command({ ping: 1 });
    
    // Test collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const requiredCollections = ['reviews'];
    const hasAllCollections = requiredCollections.every(rc => 
      collections.some(c => c.name === rc)
    );
    
    isDatabaseHealthy = hasAllCollections;
    lastCheckTime = Date.now();
    
    console.log(`Database health check: ${isDatabaseHealthy ? 'healthy' : 'degraded'}`);
    return isDatabaseHealthy;
  } catch (error) {
    console.error("Database health check failed:", error);
    isDatabaseHealthy = false;
    lastCheckTime = Date.now();
    return false;
  }
}

// Initialize connection health monitoring
export function startHealthMonitoring() {
  setInterval(checkDatabaseHealth, 60000); // Check every minute
  checkDatabaseHealth(); // Initial check
}