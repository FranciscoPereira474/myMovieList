'use client';

import ListPreview from "@/app/components/ListPreview/ListPreview";
import React, { use } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from './userPage.module.css';
import { User } from "@supabase/auth-js/dist/module/lib/types";
import { useParams } from "next/navigation";
import NotFound from '@/app/not-found';

const UserPage = () => {

    const params = useParams();
    const username = params?.username as string;

    const [loggedInUser, setLoggedInUser] = React.useState<User | null>(null);
    const [loggedInUsername, setLoggedInUsername] = React.useState<string | null>(null);
    const [profileUserId, setProfileUserId] = React.useState<string | null>(null);
    const [isOwnProfile, setIsOwnProfile] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [userNotFound, setUserNotFound] = React.useState(false);

    const headerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (headerRef.current && username) {
            const length = username.length;

            // Username máximo: 20 caracteres
            // Ícone: 96px para nomes curtos, diminui até 64px para nomes longos
            const iconSize = Math.max(64, Math.min(96, 96 - ((length - 5) * 2)));

            // Fonte: 2.5rem para nomes curtos, diminui até 1.6rem para nomes longos
            const fontSize = Math.max(1.6, Math.min(2.5, 2.5 - ((length - 5) * 0.06)));

            headerRef.current.style.setProperty('--icon-size', `${iconSize}px`);
            headerRef.current.style.setProperty('--font-size', `${fontSize}rem`);
        }
    }, [username]);

    React.useEffect(() => {
        const initializePage = async () => {
            if (!username) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Get profile user ID from username in URL
                const { data: profileData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (userError || !profileData?.id) {
                    setUserNotFound(true);
                    setLoading(false);
                    return;
                }

                setProfileUserId(profileData.id);

            } catch (error) {
                console.error('Error initializing page:', error);
            } finally {
                setLoading(false);
            }
        };

        initializePage();

    }, [username]);

    if (loading) {
        return (
            <div className={styles.loading}>Loading...</div>
        );
    }

    if (userNotFound) return <NotFound customMessage="User not found!" />

    const recentlyWatchedUserLink = `/ratings/${username}/?sortBy=date_desc`;
    const watchedUserLink = `/ratings/${username}/?sortBy=rating_desc`;
    const watchListUserLink = `/watchlist/${username}/?sortBy=added_desc`;    
    return (
        <div className={styles.userPage}> 
            <div className={styles.userHeader}>
                <div className={styles.userHeaderContent} ref={headerRef}>
                    <div className={styles.userIcon}><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e3e3e3"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg></div>

                    <div className={styles.userName}>
                        {username}
                    </div>
                </div>
            </div>

            <ListPreview label="Recently Watched" link={recentlyWatchedUserLink} movieQueryFunction="user_recently_watched" userId={profileUserId ?? undefined} requiresUserId={true} showUserRatings={true}></ListPreview>
            <ListPreview label="Watched" link={watchedUserLink} movieQueryFunction="user_watched" userId={profileUserId ?? undefined} requiresUserId={true} showUserRatings={true}></ListPreview>
            <ListPreview label="Watch List" link={watchListUserLink} movieQueryFunction="user_watch_list" userId={profileUserId ?? undefined} requiresUserId={true}></ListPreview>
        </div>
    );
    
}

export default UserPage;