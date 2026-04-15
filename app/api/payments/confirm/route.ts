import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { amount, method, reference } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Actualizar wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", "USDT")
      .single()

    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })

    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) + amount,
        available_balance: Number(wallet.available_balance) + amount,
      })
      .eq("id", wallet.id)

    if (updateError) throw new Error(updateError.message)

    // Registrar transacción
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      status: "completed",
      amount,
      currency: "USDT",
      payment_method: method,
      description: `Deposit via ${method}`,
      reference: reference ?? `${method}-${Date.now()}`,
    })

    return NextResponse.json({ success: true, newBalance: Number(wallet.balance) + amount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}