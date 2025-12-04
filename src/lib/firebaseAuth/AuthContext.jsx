import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthContext from "./context";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const syncUser = useCallback((firebaseUser) => {
    const mapped = mapFirebaseUser(firebaseUser);
    setUser(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        syncUser(firebaseUser);
        setError(null);
        setLoading(false);
      },
      (authError) => {
        console.error("[AuthProvider] onAuthStateChanged error", authError);
        setError(authError);
        setUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncUser]);

  const refreshUser = useCallback(() => syncUser(auth.currentUser), [syncUser]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      setError(null);
      const credential = await signInWithPopup(auth, provider);
      return syncUser(credential.user);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [syncUser]);

  const signInWithEmail = useCallback(
    async (email, password) => {
      try {
        setError(null);
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        return syncUser(credential.user);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [syncUser]
  );

  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      syncUser(null);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [syncUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      resetPassword,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      resetPassword,
      logout,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
