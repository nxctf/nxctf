'use client'

import { useState } from 'react'
import { ClipboardCopy, Download, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { Attachment, ChallengeWithSolve } from '@/shared/types'
import type { KeyedBooleanMap } from '../../types'

const RESOURCE_ACTION_CLASS =
  `flex select-none items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-50 ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`

type ChallengeAttachmentsProps = {
  challenge: ChallengeWithSolve
  downloading: KeyedBooleanMap
  downloadFile: (attachment: Attachment, attachmentKey: string) => void
}

export default function ChallengeAttachments({
  challenge,
  downloading,
  downloadFile,
}: ChallengeAttachmentsProps) {
  const [copiedAll, setCopiedAll] = useState<Record<string, boolean>>({})

  if (!challenge.attachments || challenge.attachments.length === 0) return null

  return (
    <div className="space-y-3">
      {challenge.attachments.some((attachment) => attachment.type === 'file') && (
        <div>
          <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
            <FileText className="h-4 w-4" />
            <span>Files</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              key="copy-wget-all"
              type="button"
              title="Copy wget commands for all files"
              className={RESOURCE_ACTION_CLASS}
              onClick={(event) => {
                event.stopPropagation()
                const fileAttachments = challenge.attachments!.filter((attachment) => attachment.type === 'file' && (attachment.url || attachment.name))
                if (!fileAttachments.length) return
                const commands = fileAttachments.map((attachment, idx) => {
                  const url = attachment.url || ''
                  const filename = (attachment.name && attachment.name.trim()) || url.split('/').pop() || `file-${idx}`
                  const escUrl = url.replace(/'/g, "'\\''")
                  const escName = filename.replace(/'/g, "'\\''")
                  return `wget '${escUrl}' -O '${escName}'`
                })
                const joined = commands.join(' && ')
                if (!navigator.clipboard) {
                  toast.error('Clipboard not available')
                  return
                }
                navigator.clipboard.writeText(joined).then(() => {
                  const key = `${challenge.id}-copied`
                  setCopiedAll((prev) => ({ ...prev, [key]: true }))
                  setTimeout(() => setCopiedAll((prev) => ({ ...prev, [key]: false })), 2000)
                  toast.success('Copied wget commands to clipboard')
                }).catch((error) => {
                  console.error('Copy failed', error)
                  toast.error('Failed to copy to clipboard')
                })
              }}
            >
              <ClipboardCopy className="h-4 w-4 text-green-500 dark:text-green-400" />
              <span className="font-mono text-xs uppercase tracking-wider">
                {copiedAll[`${challenge.id}-copied`] ? 'Copied!' : 'copy wget'}
              </span>
            </button>

            <span
              aria-hidden="true"
              className="mx-1 hidden h-8 w-px self-center bg-gray-200 dark:bg-gray-700 sm:block"
            />

            {challenge.attachments.filter((attachment) => attachment.type === 'file').map((attachment, idx) => {
              const displayName = attachment.name?.length > 40 ? attachment.name.slice(0, 37) + '...' : attachment.name || 'file'
              const key = `${challenge.id}-${idx}`
              return (
                <button
                  key={key}
                  type="button"
                  title={attachment.name}
                  className={RESOURCE_ACTION_CLASS}
                  onClick={(event) => {
                    event.stopPropagation()
                    downloadFile(attachment, key)
                  }}
                  disabled={downloading[key]}
                >
                  <Download className="h-4 w-4 text-gray-400" />
                  {downloading[key] ? 'Downloading...' : displayName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {challenge.attachments.some((attachment) => attachment.type !== 'file') && (
        <div>
          <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
            <LinkIcon className="h-4 w-4" />
            <span>Links</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {challenge.attachments.filter((attachment) => attachment.type !== 'file').map((attachment, idx) => {
              const displayName = attachment.name?.length > 40 ? attachment.name.slice(0, 37) + '...' : attachment.name || (attachment.url ? attachment.url.slice(0, 40) + '...' : 'link')
              return (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={attachment.url}
                  className={RESOURCE_ACTION_CLASS}
                >
                  <LinkIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  <span>{displayName}</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
