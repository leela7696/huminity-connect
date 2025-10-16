-- Create enum for ticket status
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create enum for ticket priority
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for ticket category
CREATE TYPE ticket_category AS ENUM ('leave', 'payroll', 'benefits', 'policy', 'documents', 'it_support', 'general', 'other');

-- Create enum for message sender role
CREATE TYPE message_sender_role AS ENUM ('employee', 'hr', 'system', 'bot');

-- Support FAQs / Knowledge Base Table
CREATE TABLE public.support_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category ticket_category NOT NULL,
  tags TEXT[],
  confidence DECIMAL(3,2) DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Support Tickets Table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  sla_breach BOOLEAN DEFAULT false,
  chat_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support Ticket Messages Table
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_role message_sender_role NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat Sessions Table (for AI chatbot conversations)
CREATE TABLE public.support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT,
  escalated_to_ticket UUID REFERENCES public.support_tickets(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE public.support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE,
  role message_sender_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_support_chat_sessions_user_id ON public.support_chat_sessions(user_id);
CREATE INDEX idx_support_chat_messages_session_id ON public.support_chat_messages(session_id);
CREATE INDEX idx_support_faqs_category ON public.support_faqs(category);
CREATE INDEX idx_support_faqs_is_active ON public.support_faqs(is_active);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.support_tickets;
  ticket_num := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_support_tickets
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_faqs_updated_at
BEFORE UPDATE ON public.support_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_chat_sessions_updated_at
BEFORE UPDATE ON public.support_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_faqs
CREATE POLICY "Everyone can view active FAQs"
ON public.support_faqs FOR SELECT
USING (is_active = true);

CREATE POLICY "HR and Admins can manage FAQs"
ON public.support_faqs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (
  created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "HR and Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (
  created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "HR and Admins can update tickets"
ON public.support_tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for support_ticket_messages
CREATE POLICY "Users can view messages for their tickets"
ON public.support_ticket_messages FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets
    WHERE created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  AND is_internal_note = false
);

CREATE POLICY "HR can view all ticket messages"
ON public.support_ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can create messages for their tickets"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.support_tickets
    WHERE created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "HR can create any ticket message"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for support_chat_sessions
CREATE POLICY "Users can view their own chat sessions"
ON public.support_chat_sessions FOR SELECT
USING (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "HR can view all chat sessions"
ON public.support_chat_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can create their own chat sessions"
ON public.support_chat_sessions FOR INSERT
WITH CHECK (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own chat sessions"
ON public.support_chat_sessions FOR UPDATE
USING (
  user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS Policies for support_chat_messages
CREATE POLICY "Users can view their own chat messages"
ON public.support_chat_messages FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.support_chat_sessions
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "HR can view all chat messages"
ON public.support_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can create messages in their sessions"
ON public.support_chat_messages FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.support_chat_sessions
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_messages;