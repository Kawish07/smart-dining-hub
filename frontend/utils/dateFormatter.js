// utils/dateFormatter.js
export const formatReservationDate = (dateString) => {
  try {
    if (!dateString) return 'Date not specified';
    
    // Handle both ISO format (2023-12-31) and other formats
    const dateObj = dateString.includes('T') 
      ? new Date(dateString) 
      : new Date(`${dateString}T00:00:00`);
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', dateString);
      return dateString; // Return raw string if invalid
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString; // Fallback to raw string
  }
};