import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/firebase/config";

const AuthContext = createContext({ user: null, loading: true });

const buildProfileSeed = (firebaseUser) => {
  const name = firebaseUser.displayName || "";
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: name,
    fullName: name,
    full_name: name,
    photoURL: firebaseUser.photoURL || null,
    emailVerified: firebaseUser.emailVerified,
    provider: firebaseUser.providerData?.[0]?.providerId || "password",
  };
};

const withNameAliases = (profile = {}) => {
  const fallbackName =
    profile.full_name ||
    profile.fullName ||
    profile.displayName ||
    profile.name ||
    "";

  return {
    ...profile,
    displayName: profile.displayName || fallbackName,
    fullName: profile.fullName || fallbackName,
    full_name: profile.full_name || fallbackName,
  };
};

async function upsertUserDocument(firebaseUser, extraData = {}) {
  if (!firebaseUser) return null;
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const basePayload = {
    ...buildProfileSeed(firebaseUser),
    onboardingComplete: false,
  };

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      ...basePayload,
      ...extraData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else if (Object.keys(extraData).length > 0) {
    await setDoc(
      userRef,
      {
        ...extraData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const latestSnapshot = await getDoc(userRef);
  if (!latestSnapshot.exists()) {
    return withNameAliases({ ...basePayload, ...extraData });
  }

  return withNameAliases({
    id: latestSnapshot.id,
    ...basePayload,
    ...extraData,
    ...latestSnapshot.data(),
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await upsertUserDocument(firebaseUser, {
            lastLoginAt: serverTimestamp(),
          });
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to hydrate Firebase auth user", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await upsertUserDocument(credential.user, {
      lastLoginAt: serverTimestamp(),
    });
    setUser(profile);
    return profile;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    const profile = await upsertUserDocument(credential.user, {
      lastLoginAt: serverTimestamp(),
      fullName: credential.user.displayName || "",
      full_name: credential.user.displayName || "",
      createdVia: "google",
    });
    setUser(profile);
    return profile;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (fullName) {
      await updateProfile(credential.user, { displayName: fullName });
    }
    const normalizedFullName =
      fullName?.trim() || credential.user.displayName || "";
    const profile = await upsertUserDocument(credential.user, {
      fullName: normalizedFullName,
      full_name: normalizedFullName,
      onboardingComplete: false,
      createdVia: "email",
    });
    setUser(profile);
    return profile;
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return null;
    const profile = await upsertUserDocument(auth.currentUser);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithEmail,
      login: signInWithEmail,
      signInWithGoogle,
      signUp,
      register: signUp,
      resetPassword,
      logout,
      refresh: refreshUser,
    }),
    [
      user,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signUp,
      resetPassword,
      logout,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
