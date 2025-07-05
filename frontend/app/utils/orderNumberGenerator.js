// utils/orderNumberGenerator.js
export function generateOrderNumber() {
    const prefix = "ORD";
    const datePart = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(2, 10);
    const randomPart = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${datePart}-${randomPart}`;
  }