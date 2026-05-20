-- ==============================================
-- Table: notifications
-- ==============================================

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  level VARCHAR(16) DEFAULT 'info',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
