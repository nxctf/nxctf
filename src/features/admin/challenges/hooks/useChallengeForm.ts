"use client"

import { useState, useCallback } from 'react'
import { Challenge, ChallengeFormData, Attachment, SubChallengeFormRow, ChallengePayload } from '../types'
import {
  getAdminSubChallenges,
  addChallenge,
  updateChallenge,
  addAdminSubChallenge,
  deleteAdminSubChallenge,
  getAdminSubChallenges as fetchSubChallenges,
  getChallengeById,
  getFlag
} from '../lib'
import APP from '@/config'
import toast from 'react-hot-toast'
import { normalizeNxctlServiceValues } from '@/features/challenges/lib/nxctl-services'

export const EMPTY_CHALLENGE_FORM: ChallengeFormData = {
  title: '',
  description: '',
  category: '',
  points: 100,
  max_points: 100,
  flag: '',
  hint: [],
  difficulty: '',
  attachments: [],
  is_dynamic: false,
  is_active: true,
  is_maintenance: false,
  min_points: 0,
  decay_per_solve: 0,
  event_id: '',
  flag_placeholder: false,
  services: [],
}

export function useChallengeForm() {
  const [formData, setFormData] = useState<ChallengeFormData>({ ...EMPTY_CHALLENGE_FORM })
  const [editing, setEditing] = useState<Challenge | null>(null)
  const [subChallenges, setSubChallenges] = useState<SubChallengeFormRow[]>([])
  const [subChallengesSequential, setSubChallengesSequential] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Extra state from original component
  const [flagPreviewOpen, setFlagPreviewOpen] = useState(false)
  const [flagLoading, setFlagLoading] = useState(false)
  const [fetchedFlag, setFetchedFlag] = useState<string | null>(null)
  const [questionPreviewRows, setQuestionPreviewRows] = useState<Record<number, boolean>>({})

  const normalizeQuestionMarkdown = (value: string) => {
    const trimmed = String(value ?? '').trim()
    const wrappedInQuotes = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('“') && trimmed.endsWith('”'))
    return wrappedInQuotes ? trimmed.slice(1, -1).trim() : trimmed
  }

  const normalizeSubChallenges = (rows: any[]): SubChallengeFormRow[] => {
    const normalized = (rows || [])
      .map((row) => ({
        id: row?.id ? String(row.id) : undefined,
        question: String(row?.question ?? ''),
        answer: String(row?.answer ?? ''),
        order_number: row?.order_number === null || typeof row?.order_number === 'undefined' ? 0 : Number(row.order_number),
        is_sequential: !!row?.is_sequential,
      }))
      .sort((a, b) => Number(a.order_number || 0) - Number(b.order_number || 0))
      .map((row, idx) => ({ ...row, order_number: idx + 1 })) as SubChallengeFormRow[]
    return normalized.length > 0 ? normalized : []
  }

  const resetForm = useCallback((initialData: Partial<ChallengeFormData> = {}) => {
    setFormData({ ...EMPTY_CHALLENGE_FORM, ...initialData })
    setEditing(null)
    setSubChallenges([])
    setSubChallengesSequential(false)
    setShowPreview(false)
    setFlagPreviewOpen(false)
    setFetchedFlag(null)
    setQuestionPreviewRows({})
  }, [])

  const loadChallengeForEdit = useCallback(async (c: Challenge) => {
    const detail = await getChallengeById(c.id)
    const full = detail ? { ...c, ...detail } : c

    let parsedHint: string[] = []
    if (Array.isArray(full.hint)) parsedHint = full.hint.filter((h): h is string => typeof h === 'string')
    else if (typeof full.hint === 'string' && full.hint.trim() !== '') {
      try {
        const arr = JSON.parse(full.hint)
        if (Array.isArray(arr)) parsedHint = arr.filter((h: any) => typeof h === 'string')
      } catch {
        parsedHint = [full.hint]
      }
    }

    setEditing(full)
    const subChallengeRows = await getAdminSubChallenges(c.id)
    const normalized = normalizeSubChallenges(subChallengeRows)

    setFormData({
      title: full.title,
      description: full.description || '',
      category: full.category || 'Web',
      points: full.points != null ? Math.max(0, full.points) : 100,
      max_points: full.max_points != null ? Math.max(0, full.max_points) : (full.points != null ? Math.max(0, full.points) : 100),
      flag: full.flag || '',
      hint: parsedHint,
      difficulty: full.difficulty || 'Easy',
      attachments: full.attachments || [],
      is_dynamic: full.is_dynamic ?? false,
      is_active: full.is_active ?? true,
      is_maintenance: full.is_maintenance ?? false,
      min_points: full.min_points ?? 0,
      decay_per_solve: full.decay_per_solve ?? 0,
      event_id: full.event_id ?? null,
      flag_placeholder: (full as any).flag_placeholder ?? false,
      services: (full as any).services || [],
    })
    setSubChallenges(normalized)
    setSubChallengesSequential(normalized.length > 0 ? !!normalized[0].is_sequential : false)
    setShowPreview(false)
  }, [])

  const handleViewFlag = async (id?: string | any) => {
    try {
      const targetId = (typeof id === 'string' ? id : null) || (editing && editing.id)
      if (targetId) {
        setFlagLoading(true)
        const flag = await getFlag(targetId)
        setFlagLoading(false)
        if (flag !== null && flag !== undefined) {
          setFetchedFlag(flag)
          setFlagPreviewOpen(true)
        } else {
          toast.error('Unable to fetch flag (permission or error)')
        }
      } else {
        setFetchedFlag(formData.flag || null)
        setFlagPreviewOpen(true)
      }
    } catch (err) {
      setFlagLoading(false)
      console.error(err)
      toast.error('Failed to fetch flag')
    }
  }

  const syncSubChallenges = async (challengeId: string) => {
    const existing = await fetchSubChallenges(challengeId)
    for (const row of existing) {
      await deleteAdminSubChallenge(row.id)
    }

    const normalizedRows = subChallenges
      .map((row, idx) => ({
        question: String(row.question || '').trim(),
        answer: String(row.answer || '').trim(),
        order_number: idx + 1,
        is_sequential: subChallengesSequential,
      }))
      .filter((row) => row.question !== '' && row.answer !== '')
      .map((row, idx) => ({ ...row, order_number: idx + 1 }))

    for (const row of normalizedRows) {
      await addAdminSubChallenge(challengeId, {
        question: row.question,
        answer: row.answer,
        order_number: row.order_number,
        is_sequential: row.is_sequential,
      })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload: ChallengePayload = {
        title: (formData.title || '').trim(),
        description: (formData.description || '').trim(),
        category: (formData.category || '').trim(),
        points: Number(formData.points) || 0,
        hint: (formData.hint && formData.hint.length > 0) ? formData.hint.filter(h => h.trim() !== '') : null,
        difficulty: (formData.difficulty || '').trim(),
        attachments: (formData.attachments || []).filter((a) => (a.url || '').trim() !== ''),
        is_maintenance: !!formData.is_maintenance,
        event_id: (formData.event_id === '' || formData.event_id === 'main' || formData.event_id === null) ? null : formData.event_id,
        flag: (formData.flag || '').trim(),
        flag_placeholder: !!formData.flag_placeholder,
        services: normalizeNxctlServiceValues(formData.services || []),
      }

      if (editing && typeof formData.is_active !== 'undefined') payload.is_active = !!formData.is_active
      if (typeof formData.is_dynamic !== 'undefined') payload.is_dynamic = formData.is_dynamic
      if (typeof formData.min_points !== 'undefined') payload.min_points = Number(formData.min_points) || 0
      if (typeof formData.decay_per_solve !== 'undefined') payload.decay_per_solve = Number(formData.decay_per_solve) || 0
      if (formData.is_dynamic) payload.max_points = Number(formData.max_points) || Number(formData.points) || 0

      if (editing) {
        await updateChallenge(editing.id, payload)
        await syncSubChallenges(editing.id)
      } else {
        if (!formData.flag.trim()) {
          toast.error('Flag is required for new challenges')
          return false
        }
        const createdId = await addChallenge(payload)
        if (createdId) await syncSubChallenges(createdId)
      }

      toast.success('Challenge saved successfully')
      return true
    } catch (err) {
      console.error(err)
      toast.error('Failed to save challenge')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const renumberSubChallenges = (rows: SubChallengeFormRow[]) => rows.map((row, idx) => ({ ...row, order_number: idx + 1 }))

  const subChallengeOps = {
    add: () => setSubChallenges(prev => renumberSubChallenges([...prev, { question: '', answer: '', order_number: prev.length + 1, is_sequential: false }])),
    update: (index: number, field: keyof SubChallengeFormRow, value: any) => setSubChallenges(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: value } : row)),
    remove: (index: number) => setSubChallenges(prev => renumberSubChallenges(prev.filter((_, idx) => idx !== index))),
    reorder: (from: number, to: number) => setSubChallenges(prev => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return renumberSubChallenges(next)
    })
  }

  const hintOps = {
    add: () => setFormData(p => ({ ...p, hint: [...(p.hint || []), ''] })),
    update: (i: number, v: string) => setFormData(p => ({ ...p, hint: p.hint.map((h, idx) => idx === i ? v : h) })),
    remove: (i: number) => setFormData(p => ({ ...p, hint: p.hint.filter((_, idx) => idx !== i) }))
  }

  const attachmentOps = {
    add: () => setFormData(p => ({ ...p, attachments: [...p.attachments, { name: '', url: '', type: 'file' }] })),
    update: (i: number, f: keyof Attachment, v: string) => setFormData(p => ({ ...p, attachments: p.attachments.map((a, idx) => idx === i ? { ...a, [f]: v } : a) })),
    remove: (i: number) => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, idx) => idx !== i) }))
  }

  return {
    formData,
    setFormData,
    editing,
    subChallenges,
    subChallengesSequential,
    setSubChallengesSequential,
    submitting,
    showPreview,
    setShowPreview,
    resetForm,
    loadChallengeForEdit,
    handleSubmit,
    subChallengeOps,
    hintOps,
    attachmentOps,
    flagPreviewOpen,
    setFlagPreviewOpen,
    flagLoading,
    fetchedFlag,
    setFetchedFlag,
    questionPreviewRows,
    setQuestionPreviewRows,
    handleViewFlag,
    normalizeQuestionMarkdown
  }
}
