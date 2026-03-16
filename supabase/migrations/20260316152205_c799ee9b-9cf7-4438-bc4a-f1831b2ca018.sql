
INSERT INTO public.categorias (nome) VALUES 
  ('Máquinas'), ('Ferramentas'), ('Informática'), 
  ('Móveis e Utensílios'), ('Infraestrutura – Instalações'), ('Veículos')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.setores (nome) VALUES 
  ('Corte Marcenaria'), ('Montagem Marcenaria'), ('Solda'), 
  ('Visual'), ('Fachada'), ('Montagem Externa'), ('Administrativo')
ON CONFLICT (nome) DO NOTHING;
