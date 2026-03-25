'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, supabase } from '@/lib/firebase';
import type { DBUser } from '@/lib/db';

const googleProvider = new GoogleAuthProvider();

// Fetch the user's profile from Supabase using their Firebase UID
async function fetchProfile(uid: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) return null;
  return data as DBUser;
}

// Write a new user profile to Supabase on first sign-up
async function createProfile(
  uid: string,
  email: string,
  name: string,
  role: 'teacher' | 'learner'
): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({ id: uid, email, name, role })
    .select()
    .single();

  if (error) return null;
  return data as DBUser;
}

export function useAuth() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔁 Firebase handles the session; Supabase provides the profile + role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await fetchProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            // Profile missing — sign out to avoid broken state
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ LOGIN — Firebase authenticates, Supabase provides the profile
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged above will handle setting the user
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ SIGNUP — Firebase creates the account, Supabase stores the profile
  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'teacher' | 'learner'
  ) => {
    setIsLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set display name on Firebase profile
      await updateProfile(firebaseUser, { displayName: name });

      // Write profile to Supabase — this is the source of truth for role
      const profile = await createProfile(firebaseUser.uid, email, name, role);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ GOOGLE SIGN IN — creates Supabase profile on first sign-in
  const signInWithGoogle = useCallback(async (
    role: 'teacher' | 'learner' = 'learner'
  ) => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Check if profile already exists in Supabase
      let profile = await fetchProfile(firebaseUser.uid);

      // First time signing in with Google — create the profile
      if (!profile) {
        profile = await createProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || '',
          role
        );
      }

      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ RESET PASSWORD — handled entirely by Firebase
  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ LOGOUT
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    logout,
  };
}

// 🎯 Role helper
export function useRole() {
  const { user } = useAuth();
  return user?.role || null;
}