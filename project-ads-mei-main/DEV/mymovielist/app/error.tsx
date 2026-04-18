'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import styles from './styles/ErrorPagesStyle.module.css'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const error = ({ error, reset }: ErrorProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.text}>
        <h2>ERROR</h2>
        <h1>Sorry!</h1>
        <p>Something went wrong...</p>
        <div>
          <div className={styles.action} onClick={() => reset()}>Try again</div>
          <Link className={styles.action} href="/">Go back to Home</Link>
        </div>
      </div>
      <Image className={styles.image} src="/fail.jpg" alt="Not Found Image" height={300} width={400}/>
    </div>
  )
}

export default error