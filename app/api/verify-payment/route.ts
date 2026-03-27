import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const WALLET_ETH = '0xf6df0842bc8983029181f822d25ac2ca9ddd0487'.toLowerCase()
const WALLET_BASE = '0xf6df0842bc8983029181f822d25ac2ca9ddd0487'.toLowerCase()
const USDC_CONTRACT_ETH = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()
const USDC_CONTRACT_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase()

// USDC Transfer event topic (Transfer(address,address,uint256))
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// Plan config: amount in USDC (6 decimals) → plan name
const PLAN_BY_AMOUNT: Record<number, string> = {
  1: 'starter',
  99: 'pro',
}

const EXPLORER_API: Record<string, string> = {
  eth: 'https://api.etherscan.io/api',
  base: 'https://api.basescan.org/api',
}

export async function POST(req: NextRequest) {
  try {
    const { txHash, network, userId } = await req.json()

    if (!txHash || !network || !userId) {
      return NextResponse.json({ error: 'Missing txHash, network, or userId' }, { status: 400 })
    }

    if (!['eth', 'base'].includes(network)) {
      return NextResponse.json({ error: 'Invalid network. Use eth or base' }, { status: 400 })
    }

    // 1. Get transaction receipt from block explorer
    const apiUrl = EXPLORER_API[network]
    const receiptRes = await fetch(
      `${apiUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`
    )
    const receiptData = await receiptRes.json()

    if (!receiptData.result || receiptData.result.status !== '0x1') {
      return NextResponse.json({ error: 'Transaction not found or failed. Wait a minute and try again.' }, { status: 400 })
    }

    const receipt = receiptData.result

    // 2. Find USDC Transfer log to our wallet
    const usdcContract = network === 'eth' ? USDC_CONTRACT_ETH : USDC_CONTRACT_BASE
    const ourWallet = network === 'eth' ? WALLET_ETH : WALLET_BASE

    const transferLog = receipt.logs.find((log: any) => {
      if (log.address.toLowerCase() !== usdcContract) return false
      if (!log.topics || log.topics[0] !== TRANSFER_TOPIC) return false
      // topics[2] = recipient (padded to 32 bytes)
      const recipient = '0x' + log.topics[2].slice(26).toLowerCase()
      return recipient === ourWallet
    })

    if (!transferLog) {
      return NextResponse.json({ error: 'No USDC transfer to GhostShield wallet found in this transaction.' }, { status: 400 })
    }

    // 3. Verify amount
    const rawAmount = BigInt(transferLog.data)
    const usdcAmount = Number(rawAmount) / 1_000_000 // USDC has 6 decimals

    const planName = PLAN_BY_AMOUNT[usdcAmount]
    if (!planName) {
      return NextResponse.json({
        error: `Invalid amount: $${usdcAmount} USDC. Expected $1 (Starter) or $99 (Pro).`
      }, { status: 400 })
    }

    // 4. Update Supabase subscription
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const scanLimit = planName === 'pro' ? 1000 : 1

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: planName,
        scan_limit: scanLimit,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to activate plan. Contact support.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plan: planName,
      amount: usdcAmount,
      message: `${planName === 'pro' ? 'Pro' : 'Starter'} plan activated!`
    })

  } catch (err: any) {
    console.error('Verify payment error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}
