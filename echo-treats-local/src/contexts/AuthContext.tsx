import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Ensures a profile row exists with email + name for any user (email/password, Google, any OAuth)
const ensureProfile = async (user: User) => {
  const { data: existing } = await (supabase
    .from("profiles") as any)
    .select("user_id, full_name, email")
    .eq("user_id", user.id)
    .maybeSingle() as { data: { user_id: string; full_name: string | null; email: string | null } | null };

  const metaName = (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    ""
  ).trim();

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  // Always store/refresh email from auth
  if (user.email) updates.email = user.email;

  if (!existing) {
    // New user (Google OAuth etc.) — create profile with name + email
    await supabase.from("profiles").upsert(
      { user_id: user.id, full_name: metaName || null, ...updates },
      { onConflict: "user_id" }
    );
  } else {
    // Fill missing name from metadata
    if (!existing.full_name && metaName) updates.full_name = metaName;
    // Always keep email in sync
    if (user.email && existing.email !== user.email) updates.email = user.email;
    if (Object.keys(updates).length > 1) { // more than just updated_at
      await supabase.from("profiles")
        .update(updates)
        .eq("user_id", user.id);
    }
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async (userId: string, finalizeLoading = false) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
    if (finalizeLoading) setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Call checkAdmin via setTimeout (keeps callback sync) — it will finalize loading
        setTimeout(() => checkAdmin(session.user.id, true), 0);
        // For Google/OAuth sign-ins, ensure a profile row exists with their name
        if (event === "SIGNED_IN") {
          setTimeout(() => ensureProfile(session.user), 0);
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdmin(session.user.id, true);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: fullName, phone } },
    });

    if (!error && data.user) {
      await (supabase.from("profiles") as any).upsert({
        user_id: data.user.id,
        full_name: fullName,
        phone: phone,
        email: email,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear state immediately for instant logout feel
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};