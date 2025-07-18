// Authentication utilities and functions
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, AUTHORIZED_EMAIL } from "./firebase";

/**
 * Check if user email is authorized
 */
export const isAuthorizedUser = (user: User | null): boolean => {
  return user?.email === AUTHORIZED_EMAIL;
};

/**
 * Sign in with Google
 * Only allows the authorized email address
 */
export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    if (!isAuthorizedUser(user)) {
      // Sign out unauthorized user
      await firebaseSignOut(auth);
      return {
        success: false,
        error: "Access denied. Only authorized users can access this application."
      };
    }
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Sign-in error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign in with Google"
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

/**
 * Auth state change listener
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Only pass authorized users to callback
    if (user && isAuthorizedUser(user)) {
      callback(user);
    } else {
      callback(null);
    }
  });
}; 