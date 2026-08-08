import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { setUser, finishInitializing, logout } from '../store/authSlice';
import { fetchCurrentUser } from '../services/auth.service';

/**
 * Exchanges a persisted token for the current user on first mount, so a page
 * refresh keeps the user signed in.
 *
 * Runs once per app load. Route guards block on `isInitializing` until this
 * resolves, otherwise a refresh would redirect an authenticated user to /login
 * before the token had a chance to be validated.
 */
export const useSessionRestore = () => {
  const dispatch = useDispatch();
  const { token, isInitializing } = useSelector((state: RootState) => state.auth);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      dispatch(finishInitializing());
      return;
    }

    fetchCurrentUser()
      .then((user) => dispatch(setUser(user)))
      // A rejected token is not a recoverable state — drop it and start clean
      .catch(() => dispatch(logout()));
  }, [dispatch, token]);

  return { isInitializing };
};
