# Instruções para configurar o Supabase

## 1. Desabilitar confirmação por email

Acesse: https://supabase.com/dashboard/project/nzvdcpzndkbjmojmqskg/auth/settings

Na seção **Authentication Settings**:
- Desmarque "Enable email confirmations" 
- OU mude "Email confirmation" para "Disabled"
- Clique em "Save"

## 2. Aplicar as políticas RLS no Dashboard do Supabase:

Acesse: https://supabase.com/dashboard/project/nzvdcpzndkbjmojmqskg/sql

Vá para "SQL Editor" e execute os comandos abaixo:

```sql
-- Remove políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can insert their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can view their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can update their own instructors" ON public.praiativa_instrutores;
DROP POLICY IF EXISTS "Users can delete their own instructors" ON public.praiativa_instrutores;

-- Cria novas políticas para praiativa_instrutores
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

-- Corrige políticas de perfis
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

-- Corrige políticas de alunos
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
```

## Após executar, teste o cadastro novamente no aplicativo.
