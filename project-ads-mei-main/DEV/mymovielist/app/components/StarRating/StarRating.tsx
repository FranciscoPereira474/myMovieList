import React from 'react';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number; // Expecting 1-10 scale from DB
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  // Convert 1-10 scale to 0-5 scale
  const displayRating = rating / 2;
  
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (displayRating >= i) {
      stars.push(<StarIcon key={i} className={styles.star} />);
    } else if (displayRating >= i - 0.5) {
      stars.push(<StarHalfIcon key={i} className={styles.star} />);
    } else {
      stars.push(<StarBorderIcon key={i} className={styles.star} />);
    }
  }

  return (
    <div className={styles.container} aria-label={`Rating: ${displayRating} out of 5`}>
      {stars}
    </div>
  );
};

export default StarRating;
