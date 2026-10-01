import { Card, Chip } from '@/components/ui'

export function DicomSpikePage() {
  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-8">
      <Card className="bg-clinical-950 text-white">
        <Chip>Technical spike</Chip>
        <h1 className="mt-4 text-title font-bold">DICOM viewer</h1>
        <p className="mt-2 text-neutral-300">Cornerstone3D initialization arrives in P1-T11.</p>
      </Card>
    </div>
  )
}
