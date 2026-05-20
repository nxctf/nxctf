-- ==============================================
-- Table: event_join_requests
-- ==============================================

CREATE TABLE public.event_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note VARCHAR(255) DEFAULT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_join_requests_event_id ON public.event_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_user_id ON public.event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_status ON public.event_join_requests(status);
