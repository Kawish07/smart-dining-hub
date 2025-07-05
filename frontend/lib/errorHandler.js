// lib/errorHandler.js
export function handleReservationError(error) {
    console.error('Reservation Error:', error);
    
    const defaultMessage = 'Failed to process reservation. Please try again.';
    
    if (error.response) {
      // API returned an error response
      const apiError = error.response.data?.error || error.response.data?.message;
      return apiError || defaultMessage;
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error. Please check your connection.';
    } else {
      // Something happened in setting up the request
      return error.message || defaultMessage;
    }
  }