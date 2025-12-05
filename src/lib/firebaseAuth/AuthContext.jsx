import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import AuthContext from "./context";
import {
  firebaseAuth,
  googleAuthProvider,
} from "@/lib/firebaseClient";

const mapFirebaseUser = (firebaseUser) => {
  if (!firebaseUser) return null;

  const providerProfile = firebaseUser.providerData?.find(Boolean) || {};
  const displayName =
    firebaseUser.displayName || providerProfile.displayName || null;
  const photoURL = firebaseUser.photoURL || providerProfile.photoURL || null;
  const email = firebaseUser.email || providerProfile.email || null;
  const fallbackName = email ? email.split("@")[0] : null;

  return {
    uid: firebaseUser.uid,
    email,
    displayName,
    photoURL,
    fullName: firebaseUser.fullName || displayName || fallbackName || null,
    raw: firebaseUser,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  const syncUser = useCallback((firebaseUser) => {
    const mapped = mapFirebaseUser(firebaseUser);
    setUser(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        syncUser(firebaseUser);
        setAuthError(null);
        setInitializing(false);
      },
      (error) => {
        console.error("[AuthProvider] Unable to resolve auth state", error);
        setAuthError(error);
        setUser(null);
        setInitializing(false);
      }
    );

    return () => unsubscribe();
  }, [syncUser]);

  const refreshUser = useCallback(
    () => syncUser(firebaseAuth.currentUser),
    [syncUser]
  );

  const signIn = useCallback(
    async (email, password) => {
      try {
        setAuthError(null);
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );
        return syncUser(credential.user);
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [syncUser]
  );

  const signUp = useCallback(
    async (email, password, profile = {}) => {
      try {
        setAuthError(null);
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );
        const displayName = profile.displayName || profile.fullName || null;
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        return syncUser(credential.user);
      } catch (error) {
        setAuthError(error);
        throw error;
      }
    },
    [syncUser]
  );

  const signOut = useCallback(async () => {
    try {
      setAuthError(null);
      await firebaseSignOut(firebaseAuth);
      syncUser(null);
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, [syncUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      const credential = await signInWithPopup(
        firebaseAuth,
        googleAuthProvider
      );
      return syncUser(credential.user);
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, [syncUser]);

  const resetPassword = useCallback(async (email) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      loading: initializing,
      error: authError,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      refreshUser,
    }),
    [
      user,
      initializing,
      authError,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
