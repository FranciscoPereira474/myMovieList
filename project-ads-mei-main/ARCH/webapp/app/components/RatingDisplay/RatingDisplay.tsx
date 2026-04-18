import React from 'react'
import styles from './RatingDisplay.module.css';

interface RatingDisplayProps {
  avgRating: number | null;
  ratingCount: number | null;
}

const RatingDisplay = ({ avgRating, ratingCount }: RatingDisplayProps) => {
  const roundedToOneDecimal = avgRating !== null ? Math.round(avgRating * 10) / 10 : null;

  return (
    <div className={styles.ratingDisplay}>
      {avgRating !== null ? (
        <>
          <div className={styles.avgRating}>
            <span>{roundedToOneDecimal}</span>
            <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m384-334 96-74 96 74-36-122 90-64H518l-38-124-38 124H330l90 64-36 122ZM233-120l93-304L80-600h304l96-320 96 320h304L634-424l93 304-247-188-247 188Zm247-369Z"/></svg>
          </div>
          <div className={styles.ratingCount}>
            <span>{ratingCount}</span>
            <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
          </div>
        </>
      ) : (
        <span>No ratings yet</span>
      )}
    </div>
  )
}

export default RatingDisplay