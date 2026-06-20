'use client'

import { useActionState } from 'react'
import { type JoinState, joinWhitelist } from '@/app/actions/join-whitelist'
import { Icon } from '@/components/ui/icons'

const INITIAL: JoinState = { status: 'idle' }

/**
 * Form waitlist -> Server Action Resend (Fase 3). useActionState: pending + success/error.
 * Anti-spam: honeypot tersembunyi + consent checkbox wajib. Validasi otoritatif di server.
 */
export function WhitelistForm({ variant, trust }: { variant: 'hero' | 'cta'; trust: string }) {
  const dark = variant === 'cta'
  const [state, formAction, isPending] = useActionState(joinWhitelist, INITIAL)

  if (state.status === 'success') {
    return dark ? (
      <div className="flex items-center justify-center gap-[14px] rounded-[14px] border border-white/[0.18] bg-white/[0.08] p-5">
        <span className="flex size-10 flex-none items-center justify-center rounded-full bg-amber">
          <Icon name="check" className="size-[22px] text-[#1c1206]" strokeWidth={2.4} />
        </span>
        <div className="text-left">
          <div className="font-extrabold text-white">Welcome aboard.</div>
          <div className="text-[0.9rem] text-[#BFD6D1]">
            You're on the early-access list. Watch your inbox.
          </div>
        </div>
      </div>
    ) : (
      <div className="flex max-w-[480px] items-center gap-[14px] rounded-[14px] border border-[rgba(21,120,110,0.22)] bg-teal-tint px-5 py-[18px]">
        <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-teal">
          <Icon name="check" className="size-5 text-white" strokeWidth={2.4} />
        </span>
        <div>
          <div className="font-bold text-brand">You're on the list.</div>
          <div className="text-[0.9rem] text-muted">
            We'll email you the moment your early-access spot opens.
          </div>
        </div>
      </div>
    )
  }

  const inputClass = dark
    ? 'min-w-0 flex-1 basis-[220px] rounded-[13px] border border-white/[0.18] bg-white/[0.08] px-4 py-[15px] text-base text-white outline-none transition focus:border-amber focus:shadow-[0_0_0_4px_rgba(224,148,46,0.22)]'
    : 'min-w-0 flex-1 basis-[220px] rounded-[13px] border border-[#E2DBCD] bg-white px-4 py-[15px] text-base text-ink outline-none transition focus:border-teal focus:shadow-[0_0_0_4px_rgba(21,120,110,0.13)]'
  const hasError = state.status === 'error'

  return (
    <div className={dark ? 'mx-auto max-w-[480px]' : 'max-w-[480px]'}>
      <form action={formAction} noValidate>
        {/* honeypot anti-spam (tak terlihat untuk manusia) */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <div className={`flex flex-wrap gap-2.5 ${dark ? 'justify-center' : ''}`}>
          <input
            type="email"
            name="email"
            required
            placeholder="you@yourvenue.com"
            aria-label="Email address"
            aria-invalid={hasError || undefined}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center justify-center gap-2 rounded-[13px] bg-amber px-6 py-[15px] font-bold text-[#1c1206] shadow-[0_7px_18px_rgba(224,148,46,0.36)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 ${dark ? 'hover:bg-[#eda549]' : 'hover:bg-amber-dark'}`}
          >
            {isPending ? (
              'Joining…'
            ) : (
              <>
                Join the waitlist
                <Icon name="arrowRight" className="size-[18px]" strokeWidth={2} />
              </>
            )}
          </button>
        </div>

        <label
          className={`mt-3.5 flex items-start gap-2.5 text-[0.86rem] ${dark ? 'justify-center text-[#8FB3AC]' : 'text-[#7A857F]'}`}
        >
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 size-4 flex-none accent-[#15786E]"
          />
          <span>I agree to receive early-access emails from Booqin.</span>
        </label>
      </form>

      {hasError ? (
        <p
          className={`font-semibold text-[0.88rem] ${dark ? 'mt-3 text-[#F6B6A8]' : 'mt-2.5 text-[#C0392B]'}`}
        >
          {state.message}
        </p>
      ) : null}

      {dark ? (
        <p className="mt-3 text-[0.86rem] text-[#8FB3AC]">{trust}</p>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-[0.86rem] text-[#7A857F]">
          <Icon name="check" className="size-[15px] flex-none text-teal" strokeWidth={2.2} />
          {trust}
        </p>
      )}
    </div>
  )
}
