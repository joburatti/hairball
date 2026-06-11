import { useCallback } from 'react'
import { useStore } from '../state/store'

export function useOpenFile() {
  const loadDotFile = useStore((s) => s.loadDotFile)
  return useCallback(
    async (file: File) => {
      const text = await file.text()
      loadDotFile(text, file.name)
    },
    [loadDotFile],
  )
}
