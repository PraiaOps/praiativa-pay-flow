-- Ensure all required columns exist in praiativa_instrutores
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'cpf_cnpj') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN cpf_cnpj TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'banco') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN banco TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'agencia') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN agencia TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'conta') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN conta TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'chave_pix') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN chave_pix TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_instrutores' AND column_name = 'numero_instrutor') THEN
    ALTER TABLE public.praiativa_instrutores ADD COLUMN numero_instrutor TEXT UNIQUE;
  END IF;
END
$$;

-- Ensure all required columns exist in praiativa_alunos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_alunos' AND column_name = 'email') THEN
    ALTER TABLE public.praiativa_alunos ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_alunos' AND column_name = 'whatsapp') THEN
    ALTER TABLE public.praiativa_alunos ADD COLUMN whatsapp TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_alunos' AND column_name = 'valor_mensalidade') THEN
    ALTER TABLE public.praiativa_alunos ADD COLUMN valor_mensalidade DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_alunos' AND column_name = 'data_vencimento') THEN
    ALTER TABLE public.praiativa_alunos ADD COLUMN data_vencimento DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'praiativa_alunos' AND column_name = 'numero_instrutor') THEN
    ALTER TABLE public.praiativa_alunos ADD COLUMN numero_instrutor TEXT;
  END IF;
END
$$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alunos_numero_instrutor') THEN
    CREATE INDEX idx_alunos_numero_instrutor ON public.praiativa_alunos(numero_instrutor);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_instrutores_numero_instrutor') THEN
    CREATE INDEX idx_instrutores_numero_instrutor ON public.praiativa_instrutores(numero_instrutor);
  END IF;
END
$$;

-- Create a table for payment records
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.praiativa_alunos(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT, -- 'pix', 'boleto', 'credit_card'
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
  payment_link TEXT,
  qr_code_data TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_records
CREATE POLICY "Users can view their own payments" 
ON public.payment_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" 
ON public.payment_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for payment_records
CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
