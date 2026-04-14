"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  country: string | null
  avatar_url: string | null
  role: "user" | "admin"
  kyc_status: "pending" | "approved" | "rejected"
  is_active: boolean
}

interface Wallet {
  id: string
  user_id: string
  currency: string
  balance: number
  available_balance: number
  locked_balance: number
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  wallets: Wallet[]
  isLoading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  refreshWallets: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    if (data) setProfile(data)
  }, [supabase])

  const fetchWallets = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
    if (data) setWallets(data)
  }, [supabase])

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await Promise.all([fetchProfile(user.id), fetchWallets(user.id)])
      }
      setIsLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchWallets(session.user.id),
          ])
        } else {
          setProfile(null)
          setWallets([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, fetchWallets, supabase])

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const refreshWallets = async () => {
    if (user) await fetchWallets(user.id)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setWallets([])
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      wallets,
      isLoading,
      isAdmin: profile?.role === "admin",
      refreshProfile,
      refreshWallets,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}