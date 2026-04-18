import React from 'react'

import styles from './Footer.module.css'
import Link from 'next/dist/client/link'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>© MyMovieList. All rights reserved.</p>
      <p>Developed by a team of students at{" "}
        <Link className={styles.link} href="https://www.uc.pt/en/">University of Coimbra</Link>:
      </p>
      <p>
        <Link className={styles.link} href="https://github.com/bbrun3x">Bruno Vilas-Boas</Link>{", "}
        <Link className={styles.link} href="https://github.com/FranciscoPereira474">Francisco Pereira</Link>{", "}
        <Link className={styles.link} href="https://github.com/FranciscoPLoureiro">Francisco Loureiro</Link>{", "}
        <Link className={styles.link} href="https://github.com/goncaloborgess">Gonçalo Borges</Link>{", "}
        <Link className={styles.link} href="https://github.com/LucasRibeiroCaetano">Lucas Caetano</Link>{", "}
        <Link className={styles.link} href="https://github.com/tiagomendes04">Tiago Mendes</Link>.
      </p>
      <p>
        Movie data from <Link className={styles.link} href="https://www.themoviedb.org/">TMDB</Link>.
      </p>
    </footer>
  )
}

export default Footer