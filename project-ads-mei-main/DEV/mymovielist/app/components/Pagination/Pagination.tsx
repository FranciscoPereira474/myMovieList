'use client'
import React from 'react'
import styles from './Pagination.module.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
}

const Pagination = ({ currentPage, totalPages, onPageChange, loading = false }: PaginationProps) => {
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  if (totalPages <= 1) return null

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev || loading}
        className={styles.paginationButton}
      >
        Previous
      </button>
      <span className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext || loading}
        className={styles.paginationButton}
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
