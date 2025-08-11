-- Add new fields to praiativa_instrutores table for banking and identification
ALTER TABLE public.praiativa_instrutores 
ADD COLUMN cpf_cnpj TEXT,
ADD COLUMN banco TEXT,
ADD COLUMN agencia TEXT,
ADD COLUMN conta TEXT,
ADD COLUMN chave_pix TEXT,
ADD COLUMN numero_instrutor TEXT UNIQUE;

-- Add new fields to praiativa_alunos table
ALTER TABLE public.praiativa_alunos 
ADD COLUMN email TEXT,
ADD COLUMN whatsapp TEXT,
ADD COLUMN valor_mensalidade DECIMAL(10,2),
ADD COLUMN data_vencimento DATE,
ADD COLUMN numero_instrutor TEXT;

-- Create index for better performance on numero_instrutor lookups
CREATE INDEX idx_alunos_numero_instrutor ON public.praiativa_alunos(numero_instrutor);
CREATE INDEX idx_instrutores_numero_instrutor ON public.praiativa_instrutores(numero_instrutor);

-- Add foreign key relationship between alunos and instrutores via numero_instrutor
-- Note: We can't use a proper foreign key constraint because numero_instrutor can be null initially
-- Instead we'll enforce this relationship at the application level