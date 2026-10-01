import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { IconButton } from '@/components/ui'

interface ArtifactOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  controls?: ReactNode
}

export function ArtifactOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  controls,
}: ArtifactOverlayProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-950/70" />
        <Dialog.Content className="fixed inset-0 z-50 flex min-h-0 flex-col bg-neutral-950 text-white outline-none">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/15 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="truncate font-bold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 truncate text-small text-neutral-300">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {controls}
              <Dialog.Close asChild>
                <IconButton
                  className="border-white/30 text-white hover:bg-white/10"
                  label="Close expanded view"
                  icon={<X aria-hidden="true" />}
                />
              </Dialog.Close>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
