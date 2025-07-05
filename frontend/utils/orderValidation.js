// @/utils/orderValidation.js

/**
 * Validate order data with comprehensive checks
 * @param {Object} orderData - The order data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
// @/utils/orderValidation.js
export function validateOrderData(orderData) {
    const errors = [];
  
    // Check for required fields
    const requiredFields = ['userId', 'items', 'totalPrice', 'paymentMethod', 'transactionId'];
    requiredFields.forEach(field => {
      if (!orderData[field]) {
        errors.push(`${field} is required`);
      }
    });
  
    // Validate userId (assuming it should be a non-empty string)
    if (orderData.userId && typeof orderData.userId !== 'string') {
      errors.push('userId must be a string');
    }
  
    // Validate items
    if (orderData.items) {
      if (!Array.isArray(orderData.items)) {
        errors.push('items must be an array');
      } else if (orderData.items.length === 0) {
        errors.push('items array cannot be empty');
      } else {
        // Validate each item
        orderData.items.forEach((item, index) => {
          if (!item.name) {
            errors.push(`Item at index ${index} is missing a name`);
          }
          if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
            errors.push(`Item at index ${index} has invalid price`);
          }
          if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
            errors.push(`Item at index ${index} has invalid quantity`);
          }
        });
      }
    }
  
    // Validate totalPrice
    if (orderData.totalPrice) {
      if (typeof orderData.totalPrice !== 'number' || orderData.totalPrice <= 0) {
        errors.push('totalPrice must be a positive number');
      }
    }
  
    // Validate paymentMethod
    const validPaymentMethods = ['Easypaisa', 'JazzCash']; // Update this list as needed
    if (orderData.paymentMethod && !validPaymentMethods.includes(orderData.paymentMethod)) {
      errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
    }
  
    // Validate transactionId
    if (orderData.transactionId && typeof orderData.transactionId !== 'string') {
      errors.push('transactionId must be a string');
    }
  
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Optional: Additional utility for sanitizing order data
  export function sanitizeOrderData(orderData) {
    return {
      userId: orderData.userId,
      items: orderData.items.map(item => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        specialInstructions: item.specialInstructions || ''
      })),
      totalPrice: Number(orderData.totalPrice),
      paymentMethod: orderData.paymentMethod,
      transactionId: orderData.transactionId
    };
  }