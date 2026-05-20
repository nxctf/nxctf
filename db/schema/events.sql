-- ==============================================
-- Table: events
-- ==============================================

CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  join_mode VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (join_mode IN ('open', 'request', 'key')),
  join_key VARCHAR(128) DEFAULT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  always_show_challenges BOOLEAN DEFAULT false,
  image_url VARCHAR(2048) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
