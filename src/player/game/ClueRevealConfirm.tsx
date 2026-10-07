import { Button, Sheet } from '@/components/ui'

export function ClueRevealConfirm({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet description={description} onOpenChange={onOpenChange} open={open} title={title}>
      <div className="flex flex-col gap-3">
        <Button onClick={onConfirm}>{confirmLabel}</Button>
        <Button onClick={() => onOpenChange(false)} variant="secondary">
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  )
}
