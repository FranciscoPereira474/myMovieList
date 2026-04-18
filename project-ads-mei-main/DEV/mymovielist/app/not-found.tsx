import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

import styles from './styles/ErrorPagesStyle.module.css'

interface NotFoundProps {
  customMessage?: string;
}

const NotFound = ({ customMessage }: NotFoundProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.text}>
        <h2>ERROR 404</h2>
        <h1>{customMessage || "Page not found!"}</h1>
        <p>The page you are looking for does not exist or has been removed.</p>
        <Link className={styles.action} href="/">Go back to Home</Link>
      </div>
      <Image className={styles.image} src="/fail.jpg" alt="Not Found Image" height={300} width={400}/>
    </div>
  )
}

export default NotFound