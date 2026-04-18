'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

interface BrowseLayoutProps {
  filterContent: React.ReactNode;
  orderContent: React.ReactNode;
  movieGridContent: React.ReactNode;
}

export default function BrowseLayout({ filterContent, orderContent, movieGridContent }: BrowseLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* Filter and Sort controls bar */}
      <div className={styles.controlsBar}>
        <button 
          className={styles.filterToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/>
          </svg>
          Filters
        </button>
        
        <div className={styles.sortFilterWrapper}>
          {orderContent}
        </div>
      </div>

      {/* Sidebar overlay */}
      <div 
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={styles.parentContainer}>
        <div className={`${styles.filterContainer} ${sidebarOpen ? styles.filterContainerOpen : ''}`}>
          <button 
            className={styles.closeSidebar}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close filters"
          >
            ✕
          </button>
          {filterContent}
        </div>

        <div className={styles.movieGridContainer}>
          {movieGridContent}
        </div>
      </div>
    </div>
  );
}
