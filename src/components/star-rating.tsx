import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showText?: boolean;
}

export function StarRating({ rating, totalStars = 5, size = 20, className, showText = true }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} fill="hsl(var(--primary))" className="text-primary" style={{ width: size, height: size }} />
        ))}
        {halfStar && (
          <div style={{ width: size, height: size, position: 'relative' }}>
              <Star style={{ width: size, height: size }} fill="hsl(var(--muted-foreground))" className="text-muted-foreground opacity-50" />
              <div style={{ width: '50%', height: '100%', overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
                 <Star style={{ width: size, height: size }} fill="hsl(var(--primary))" className="text-primary" />
              </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} fill="hsl(var(--muted-foreground))" className="text-muted-foreground opacity-20" style={{ width: size, height: size }} />
        ))}
      </div>
      {showText && <span className="text-sm text-muted-foreground">{rating.toFixed(1)} out of {totalStars}</span>}
    </div>
  );
}
