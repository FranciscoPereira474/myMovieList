'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './DropdownLink.module.css';

interface DropdownItem {
  href: string;
  label: string;
}

interface DropdownOptions {
  mainLink: string;
  items: DropdownItem[];
}

const DropdownLink = ({ label, options }: { label: string; options: DropdownOptions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link href={options.mainLink} className={`${styles.mainLink}`}>
        <p>{label}</p>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z"/></svg>
      </Link>

      <div className={`${styles.dropdown} ${isOpen ? styles.open : ''} w-48`}>
        {options.items.map((item) => (
          <Link key={item.href} href={item.href} className={styles.dropdownItem}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DropdownLink
