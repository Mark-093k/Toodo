import { useEffect, useMemo, useRef, useState } from 'react';
import { workspaceStore } from '../store/workspaceStore';
import { getSupabaseClient } from '../supabase/client';
import { useSupabaseAuth } from '../supabase/useSupabaseAuth';

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase() || 'U';

export default function UserProfileMenu() {
  const { session } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(() => {
    const user = session?.user;
    const metadata = user?.user_metadata ?? {};
    const name =
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : user?.email ?? '';
    const avatarUrl =
      typeof metadata.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata.picture === 'string'
          ? metadata.picture
          : '';

    return {
      name,
      email: user?.email ?? '',
      avatarUrl,
      initial: getInitial(name || (user?.email ?? '')),
    };
  }, [session]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await workspaceStore.saveNow();
      await getSupabaseClient().auth.signOut();
      setIsOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '로그아웃에 실패했습니다.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="user-profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-label="User profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span>{profile.initial}</span>
        )}
      </button>

      {isOpen ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-summary">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{profile.initial}</span>
            )}
            <div>
              <strong>{profile.name || profile.email}</strong>
              <p>{profile.email}</p>
            </div>
          </div>

          <button type="button" role="menuitem" disabled={isSigningOut} onClick={() => void handleSignOut()}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
