import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useContent } from '@/app/contentContext'
import { DisplayNamePrompt } from '@/components/game/DisplayNamePrompt'
import { Button } from '@/components/ui'
import { Sheet } from '@/components/ui/Sheet'
import { CHALLENGE_LINK_VERSION, type ChallengePayload } from '@/engines/games/links'
import { buildChallengeUrl, formatShareMessage, shareChannelUrls } from '@/engines/games/share'
import { emitEvent } from '@/events/bus'
import { useLearnerStore } from '@/state/learnerStore'

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function ShareChallengeSheet({
  runId,
  gameId,
  gameVersion,
  gameTitle,
  difficulty,
  seed,
  score,
  triggerLabel,
}: {
  runId: string
  gameId: string
  gameVersion: string
  gameTitle: string
  difficulty: string
  seed: number
  score: number
  triggerLabel: string
}) {
  const config = useContent().appConfig.games
  const player = useLearnerStore((state) => state.player)
  const setPlayerDisplayName = useLearnerStore((state) => state.setPlayerDisplayName)
  const skipShareNamePrompt = useLearnerStore((state) => state.skipShareNamePrompt)
  const [namePromptOpen, setNamePromptOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copy = config?.share
  const from = player.displayName ?? copy?.fallbackName ?? 'A colleague'
  const url = useMemo(() => {
    const payload: ChallengePayload = {
      v: CHALLENGE_LINK_VERSION,
      g: gameId,
      gv: gameVersion,
      d: difficulty,
      s: seed,
      f: from.slice(0, 40),
      sc: score,
    }
    return typeof window === 'undefined'
      ? `/c/pending`
      : buildChallengeUrl(window.location.origin, payload)
  }, [difficulty, from, gameId, gameVersion, score, seed])
  const message = copy ? formatShareMessage(copy.messageTemplate, { score, gameTitle }) : ''
  const channels = shareChannelUrls(message, url)
  if (!copy) return null

  const requestOpen = () => {
    if (!player.shareNamePrompted) setNamePromptOpen(true)
    else setOpen(true)
  }

  return (
    <>
      <Button leadingIcon={<Share2 aria-hidden="true" />} onClick={requestOpen} size="lg">
        {triggerLabel}
      </Button>
      <DisplayNamePrompt
        copy={copy}
        onOpenChange={setNamePromptOpen}
        onSave={(name) => {
          setPlayerDisplayName(name)
          setNamePromptOpen(false)
          setOpen(true)
        }}
        onSkip={() => {
          skipShareNamePrompt()
          setNamePromptOpen(false)
          setOpen(true)
        }}
        open={namePromptOpen}
      />
      <Sheet description={copy.description} onOpenChange={setOpen} open={open} title={copy.title}>
        <div className="space-y-4">
          <p className="rounded-lg bg-neutral-100 p-4 text-neutral-800">{message}</p>
          <p className="break-all text-small text-neutral-600">{url}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {'share' in navigator ? (
              <Button
                leadingIcon={<Share2 aria-hidden="true" />}
                onClick={async () => {
                  try {
                    await navigator.share({ title: gameTitle, text: message, url })
                    emitEvent({ event: 'game_shared', runId, channel: 'native' })
                  } catch {
                    // Closing the native share dialog is not an error state.
                  }
                }}
              >
                {copy.nativeShare}
              </Button>
            ) : null}
            <Button
              leadingIcon={copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              onClick={async () => {
                await copyText(`${message}\n${url}`)
                setCopied(true)
                emitEvent({ event: 'game_shared', runId, channel: 'copy' })
              }}
              variant="secondary"
            >
              {copied ? copy.copied : copy.copyLink}
            </Button>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 font-semibold text-neutral-800"
              href={channels.messaging}
              onClick={() => emitEvent({ event: 'game_shared', runId, channel: 'mock' })}
            >
              <MessageCircle aria-hidden="true" size={18} />
              {copy.messaging}
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 font-semibold text-neutral-800"
              href={channels.email}
              onClick={() => emitEvent({ event: 'game_shared', runId, channel: 'mock' })}
            >
              <Mail aria-hidden="true" size={18} />
              {copy.email}
            </a>
          </div>
        </div>
      </Sheet>
    </>
  )
}
