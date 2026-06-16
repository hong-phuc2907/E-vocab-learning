import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  redirecting: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Resolve any pending redirect sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(result.user);
      })
      .catch((err) => {
        if (err?.code !== "auth/no-auth-event") {
          console.error("Redirect result error:", err?.code);
        }
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setRedirecting(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      // Popup works best on direct URLs (published app)
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        // Popup was blocked (iframe / strict browser) — fall back to redirect
        setRedirecting(true);
        await signInWithRedirect(auth, googleProvider);
      } else if (err?.code === "auth/unauthorized-domain") {
        setAuthError(
          `Domain chưa được cấp phép. Vào Firebase Console → Authentication → Settings → Authorized domains → thêm: ${window.location.hostname}`
        );
      } else {
        setAuthError("Đăng nhập thất bại. Vui lòng thử lại.");
        console.error("Sign-in error:", err?.code, err?.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, redirecting, authError, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
