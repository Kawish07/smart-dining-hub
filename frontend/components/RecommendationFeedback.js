// components/RecommendationFeedback.jsx
'use client'
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

const RecommendationFeedback = ({ itemId }) => {
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (value) => {
    setFeedback(value);
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          action: value ? 'liked_recommendation' : 'disliked_recommendation'
        })
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (submitted) return null;

  return (
    <div className="flex justify-end mt-2 space-x-2">
      <button 
        onClick={() => handleFeedback(true)}
        className={`p-1 rounded ${feedback === true ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600'}`}
      >
        <ThumbsUp size={16} />
      </button>
      <button 
        onClick={() => handleFeedback(false)}
        className={`p-1 rounded ${feedback === false ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600'}`}
      >
        <ThumbsDown size={16} />
      </button>
    </div>
  );
};