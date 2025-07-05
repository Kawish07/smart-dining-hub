"use client";
import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function ReviewForm({ order, existingReview, onClose, onSuccess }) {
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [overallComment, setOverallComment] = useState(existingReview?.overallComment || '');
  const [itemRatings, setItemRatings] = useState(() => {
    const defaultRatings = order.items.map(item => ({
      itemId: item._id,
      itemName: item.name,
      rating: 0,
      comment: ''
    }));

    if (existingReview?.itemReviews) {
      return defaultRatings.map(item => {
        const existing = existingReview.itemReviews.find(ir => ir.itemId === item.itemId);
        return existing ? { ...item, ...existing } : item;
      });
    }
    return defaultRatings;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const handleItemRatingChange = (itemId, rating) => {
    setItemRatings(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, rating } : item
    ));
  };

  const handleItemCommentChange = (itemId, comment) => {
    setItemRatings(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, comment } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!order?._id) throw new Error('Order information is missing');
      if (!session?.user?.email) throw new Error('Please login to submit a review');

      const hasRating = overallRating > 0 || itemRatings.some(item => item.rating > 0);
      if (!hasRating) throw new Error('Please provide at least one rating');

      const reviewData = {
        orderId: order._id,
        restaurantId: order.restaurantId,
        userId: session.user.email,
        overallRating: overallRating > 0 ? overallRating : null,
        overallComment: overallRating > 0 ? overallComment.trim() : "",
        itemReviews: itemRatings
          .filter(item => item.rating > 0)
          .map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            rating: item.rating,
            comment: item.comment.trim()
          }))
      };

      const response = await fetch('/api/reviews', {
        method: existingReview ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const result = await response.json();

      // Pass the updated order to the onSuccess handler
      onSuccess(result.order);
      toast.success('Review submitted successfully!');
      const refreshEvent = new Event('refreshRatings');
      window.dispatchEvent(refreshEvent);
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {existingReview ? 'Edit Your Review' : 'Write a Review'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Restaurant Experience</h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`overall-${star}`}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  className={`p-1 ${star <= overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star size={24} fill={star <= overallRating ? 'currentColor' : 'none'} />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {overallRating > 0 ? `${overallRating} stars` : 'Not rated'}
              </span>
            </div>
            <textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Share your overall dining experience..."
              className="w-full p-3 border rounded-lg text-sm min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Item Ratings</h3>
            <div className="space-y-4">
              {itemRatings.map((item) => (
                <div key={item.itemId} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-medium text-gray-800">{item.itemName}</h4>
                  <div className="flex items-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`item-${item.itemId}-${star}`}
                        type="button"
                        onClick={() => handleItemRatingChange(item.itemId, star)}
                        className={`p-1 ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star size={18} fill={star <= item.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={item.comment}
                    onChange={(e) => handleItemCommentChange(item.itemId, e.target.value)}
                    placeholder={`Tell us about ${item.itemName}...`}
                    className="w-full p-2 border rounded text-sm min-h-[60px]"
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">↻</span>
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}