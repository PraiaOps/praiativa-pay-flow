-- Create profiles table for instructors
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  contato TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add user_id to praiativa_instrutores table
ALTER TABLE public.praiativa_instrutores 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for praiativa_instrutores to filter by user
DROP POLICY IF EXISTS "Enable delete for all users" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Enable update for all users" ON public.praiativa_instrutores;

CREATE POLICY "Users can view their own instructors" 
ON public.praiativa_instrutores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instructors" 
ON public.praiativa_instrutores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instructors" 
ON public.praiativa_instrutores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instructors" 
ON public.praiativa_instrutores 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add user_id to praiativa_alunos table
ALTER TABLE public.praiativa_alunos 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for praiativa_alunos to filter by user
DROP POLICY IF EXISTS "Permitir todas operações nos alunos" ON public.praiativa_alunos;

CREATE POLICY "Users can view their own students" 
ON public.praiativa_alunos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" 
ON public.praiativa_alunos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" 
ON public.praiativa_alunos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" 
ON public.praiativa_alunos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();