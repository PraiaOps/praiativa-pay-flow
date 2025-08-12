-- Fix RLS policies to allow user registration

-- Drop existing policies that might be blocking inserts
DROP POLICY IF EXISTS "Users can insert their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can view their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can update their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can delete their own instructors" ON public.praiativa_instrutores;

-- Create new policies for praiativa_instrutores
CREATE POLICY "Allow authenticated users to insert their own instructor data" 
ON public.praiativa_instrutores 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own instructor data" 
ON public.praiativa_instrutores 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own instructor data" 
ON public.praiativa_instrutores 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own instructor data" 
ON public.praiativa_instrutores 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Allow authenticated users to insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix alunos policies
DROP POLICY IF EXISTS "Users can insert their own students" ON public.praiativa_alunos;
DROP POLICY IF EXISTS "Users can view their own students" ON public.praiativa_alunos;
DROP POLICY IF EXISTS "Users can update their own students" ON public.praiativa_alunos;
DROP POLICY IF EXISTS "Users can delete their own students" ON public.praiativa_alunos;

CREATE POLICY "Allow authenticated users to insert their own students" 
ON public.praiativa_alunos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own students" 
ON public.praiativa_alunos 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own students" 
ON public.praiativa_alunos 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own students" 
ON public.praiativa_alunos 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure payment_records policies are correct too
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payment_records;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payment_records;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payment_records;

CREATE POLICY "Allow authenticated users to insert their own payments" 
ON public.payment_records 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own payments" 
ON public.payment_records 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own payments" 
ON public.payment_records 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
