'use client';

import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import ReviewPreviewCard from '@/app/components/ReviewPreviewCard/ReviewPreviewCard';
import styles from './ReviewListPreviewSection.module.css';

interface ReviewListPreviewSectionProps {
  label: string;
  link: string;
  reviewQueryFunction: string;
  limit?: number;
}

const ReviewListPreviewSection: React.FC<ReviewListPreviewSectionProps> = ({ 
  label, 
  link, 
  reviewQueryFunction,
  limit = 4 
}) => {
  const [reviewIds, setReviewIds] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReviewIds = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .rpc(reviewQueryFunction, { p_limit: limit });

        if (error) {
          console.error(`Error in ${reviewQueryFunction}:`, error);
          return;
        }

        if (data) {
          setReviewIds(data.map((r: any) => r.review_id));
        }
      } catch (error) {
        console.error('Error fetching review IDs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewIds();
  }, [reviewQueryFunction, limit]);

  if (loading) {
    return (
      <div className={styles.sectionWrapper}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2>{label}</h2>
          </div>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (reviewIds.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h2>{label}</h2>
          <Link href={link} className={styles.moreLink}>
            More
          </Link>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.reviewsGrid}>
          {reviewIds.map((id) => (
            <ReviewPreviewCard key={id} reviewId={id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewListPreviewSection;
