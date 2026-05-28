import { execFileSync } from 'child_process'
import os from 'os'
import { NextRequest, NextResponse } from 'next/server'

const ZERO_BIN = `${os.homedir()}/.zero/bin`

const RUN_ID_PATTERN = /^run_[A-Za-z0-9_-]+$/

function clampStar(n: unknown): number | null {
  const x = Number(n)
  if (!Number.isInteger(x) || x < 1 || x > 5) return null
  return x
}

export async function POST(req: NextRequest) {
  const { runId, accuracy, value, reliability, content } = await req.json()

  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
    return NextResponse.json({ ok: false, error: 'runId must match /^run_[A-Za-z0-9_-]+$/' }, { status: 400 })
  }
  const a = clampStar(accuracy)
  const v = clampStar(value)
  // Reliability optional — fall back to accuracy for backwards compat with existing frontend
  const r = clampStar(reliability) ?? a
  if (a === null || v === null || r === null) {
    return NextResponse.json({ ok: false, error: 'accuracy/value/reliability must be integers 1-5' }, { status: 400 })
  }
  const note = typeof content === 'string' ? content.slice(0, 1000) : ''

  try {
    const args = ['review', runId, '--success', '--accuracy', String(a), '--value', String(v), '--reliability', String(r)]
    if (note) args.push('--content', note)
    const output = execFileSync('zero', args, {
      env: { ...process.env, PATH: `${ZERO_BIN}:${process.env.PATH}` },
      timeout: 15000,
      encoding: 'utf8',
    })
    return NextResponse.json({ ok: true, output })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
