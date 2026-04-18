import Link from 'next/link'
import React from 'react'
import SearchBar from '../SearchBar/SearchBar'
import UserCorner from '../UserCorner/UserCorner'
import DropdownLink from '../DropdownLink/DropdownLink'
import styles from './Navbar.module.css'



const Navbar = () => {
  return (
    <div className={styles.navbarWrapper}>
      <nav className={styles.navbar}>
        <Link className={styles.logo} href="/">
          <svg className={styles.star} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m384-334 96-74 96 74-36-122 90-64H518l-38-124-38 124H330l90 64-36 122ZM233-120l93-304L80-600h304l96-320 96 320h304L634-424l93 304-247-188-247 188Zm247-369Z"/></svg>
          <h1>Movie Catalogue</h1>
        </Link>
        <div className={styles.navItems}>
          <DropdownLink label="Browse" options={{
            mainLink: "/movies",
            items: [
              { href: "/movies", label: "All Movies" },
              { href: "/movies/1", label: "Top Rated this week" },
              { href: "/movies/2", label: "Top Rated of All Time" },
              { href: "/movies/3", label: "Most Popular this week" },
              { href: "/movies/4", label: "Most Popular of All Time" },
            ]
          }} />
          <Link className={`${styles.navButton}`} href="/users/1/watched">
            <p>Watched</p>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200v-560 454-85 191Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v320h-80v-320H200v560h280v80H200Zm494 40L552-222l57-56 85 85 170-170 56 57L694-80ZM320-440q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 160h240v-80H440v80Zm0-160h240v-80H440v80Z"/></svg>
          </Link>
          <Link className={`${styles.navButton}`} href="/users/1/watchlist">
            <p>Watchlist</p>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80Zm200-190q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Zm-20-80h40v-100h100v-40H740v-100h-40v100H600v40h100v100Z"/></svg>
          </Link>
          <div className={styles.searchBarWrapper}>
            <SearchBar />
          </div>
          <UserCorner />
        </div>
      </nav>
    </div>
  )
}

export default Navbar