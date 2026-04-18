'use client';

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './navbar.module.css'
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/auth-js/dist/module/lib/types';
import { signOut } from '@/lib/auth';
import Icon from '@mdi/react';
import { mdiMovieStar } from '@mdi/js';

import { useQueryState } from 'nuqs';

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<User | null>(null);
    const [username, setUsername] = React.useState<string | null>(null);
    const [searchValue, setSearchValue] = React.useState<string>('');

    React.useEffect(() => {
        const getUser = async () => {
            const {data : {session} } = await supabase.auth.getSession();
            if (session){
                setUser(session.user);
                
                const { data, error } = await supabase 
                    .from('users')
                    .select('username')
                    .eq('id', session.user.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching username:', error);
                } else if (data) {
                    setUsername(data.username);
                }
            } else {
                setUser(null);
            }
        }
        getUser();
        
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
            
        };
    }, []);

    return (
        <div className={styles.navbarWrapper}>
            <div className={`${styles.navbar} ${!user ? styles.loggedOut : styles.loggedIn}`}>
                
                <Link className={styles.navLogo} href="/">MyMovieList</Link>
                
                <div className={`${styles.navLinks} ${!user ? styles.navLinksLoggedOut : ''}`}>
                    <button 
                        className={styles.navLink} 
                        onClick={() => {
                            setSearchValue('');
                            if (pathname === '/browse') {
                                // If already on browse page, force a full refresh
                                window.location.href = '/browse';
                            } else {
                                // If on a different page, just navigate
                                router.push('/browse');
                            }
                        }}
                    >
                        <p>Browse</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z"/></svg>
                    </button>
                    {user && <Link className={styles.navLink} href="/ratings">
                        <p>Watched</p>
                        <Icon path={mdiMovieStar} size={1} color="var(--muted)" />
                    </Link>}
                    {user && <Link className={styles.navLink} href="/watchlist">
                        <p>Watchlist</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80Zm200-190q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Zm-20-80h40v-100h100v-40H740v-100h-40v100H600v40h100v100Z"/></svg>
                    </Link>}
                    {pathname != '/browse' &&
                    <div className={styles.navSearch}>
                        <div className={styles.search}><svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28
                        px" fill="#e3e3e3"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg></div>
                        <input 
                            type="text" 
                            placeholder="Search movies..." 
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchValue.trim()) {
                                    router.push(`/browse?search=${encodeURIComponent(searchValue)}`);
                                }
                            }}
                        />

                    </div>
                    }
                    {user && (
                        <div className={styles.navUserSection}>
                            <div className={styles.navUser}>
                                <Link className={`${styles.navLink} ${styles.userLink}`} href={`/user/${username}`}>
                                    <svg className={styles.userIcon} xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#e3e3e3"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>
                                    <div className={styles.userName}>{username}</div>
                                </Link>
                            </div>
                            <button className={styles.logoutButton} onClick={signOut} aria-label="Logout">
                                <svg className={styles.logoutIcon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
                            </button>
                        </div>
                    )}

                    {!user && <div>  
                        <Link href={`/authentication?redirect=${usePathname()}`}>Sign In / Sign Up</Link>
                    </div>}
                </div>  
            </div>
        </div>
  )
}

export default Navbar