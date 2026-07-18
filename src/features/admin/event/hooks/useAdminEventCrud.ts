"use client"

import { useCallback, useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  addEvent,
  deleteEvent,
  EMPTY_EVENT_FORM,
  fromEventInputValue,
  getEvents,
  regenerateEventJoinKey,
  toEventInputValue,
  updateEvent,
} from '../lib'
import type { Event, EventFormData } from '../types'

interface UseAdminEventCrudOptions {
  onEventsLoaded?: (events: Event[]) => void
}

export function useAdminEventCrud({ onEventsLoaded }: UseAdminEventCrudOptions = {}) {
  const [events, setEvents] = useState<Event[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [formData, setFormData] = useState<EventFormData>({ ...EMPTY_EVENT_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Event | null>(null)

  const loadEvents = useCallback(async () => {
    const data = await getEvents()
    setEvents(data)
    onEventsLoaded?.(data)
  }, [onEventsLoaded])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a.start_time ? new Date(a.start_time).getTime() : 0
      const bTime = b.start_time ? new Date(b.start_time).getTime() : 0
      return aTime - bTime
    })
  }, [events])

  const openAdd = useCallback(() => {
    setEditing(null)
    setFormData({ ...EMPTY_EVENT_FORM })
    setOpenForm(true)
  }, [])

  const openEdit = useCallback((evt: Event) => {
    setEditing(evt)
    setFormData({
      name: evt.name || '',
      description: evt.description || '',
      join_mode: evt.join_mode || 'open',
      join_key: evt.join_key || '',
      start_time: toEventInputValue(evt.start_time || null),
      end_time: toEventInputValue(evt.end_time || null),
      always_show_challenges: Boolean(evt.always_show_challenges),
      image_url: evt.image_url || '',
    })
    setOpenForm(true)
  }, [])

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Event name is required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        start_time: fromEventInputValue(formData.start_time),
        end_time: fromEventInputValue(formData.end_time),
        always_show_challenges: formData.always_show_challenges,
        image_url: formData.image_url?.trim() || null,
        join_mode: formData.join_mode,
        join_key: formData.join_mode === 'key' ? formData.join_key.trim() : null,
      }

      if (editing?.id) {
        await updateEvent(editing.id, payload)
        toast.success('Event updated')
      } else {
        await addEvent(payload)
        toast.success('Event created')
      }

      await loadEvents()
      setOpenForm(false)
      setEditing(null)
      setFormData({ ...EMPTY_EVENT_FORM })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save event')
    } finally {
      setSubmitting(false)
    }
  }, [formData, editing, loadEvents])

  const handleRegenerateJoinKey = useCallback(async () => {
    if (!editing?.id) {
      toast.error('Save event first before regenerating key')
      return
    }
    try {
      const key = await regenerateEventJoinKey(editing.id)
      setFormData((prev) => ({ ...prev, join_key: key }))
      toast.success('Join key regenerated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to regenerate join key')
    }
  }, [editing])

  const askDelete = useCallback((evt: Event) => {
    setPendingDelete(evt)
    setConfirmOpen(true)
  }, [])

  const doDelete = useCallback(async () => {
    if (!pendingDelete?.id) return
    try {
      await deleteEvent(pendingDelete.id)
      await loadEvents()
      toast.success('Event deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete event')
    } finally {
      setPendingDelete(null)
      setConfirmOpen(false)
    }
  }, [pendingDelete, loadEvents])

  return {
    sortedEvents,
    loadEvents,
    openForm,
    setOpenForm,
    editing,
    formData,
    setFormData,
    submitting,
    handleSubmit,
    handleRegenerateJoinKey,
    openAdd,
    openEdit,
    askDelete,
    confirmOpen,
    setConfirmOpen,
    pendingDelete,
    doDelete,
  }
}
