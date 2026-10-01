import { Button, Sheet } from '@/components/ui'

interface ExitConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExit: () => void
}

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onExit,
}: ExitConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Leave this activity?"
      description="Your completed steps are saved. You can resume from here later."
    >
      <div className="flex flex-col gap-3">
        <Button variant="danger" onClick={onExit}>
          Save and leave
        </Button>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Keep learning
        </Button>
      </div>
    </Sheet>
  )
}
