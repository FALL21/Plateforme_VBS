'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(rating);
        
        return (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              filled
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300',
              interactive && 'cursor-pointer hover:scale-110 transition-transform'
            )}
            onClick={() => handleClick(starValue)}
          />
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  );
}

