import { EditDiff } from './EditDiff'

export function AiDiffPanel() {
  return (
    <EditDiff
      original=""
      modified=""
      filename=""
      onAccept={() => {}}
      onReject={() => {}}
    />
  )
}
