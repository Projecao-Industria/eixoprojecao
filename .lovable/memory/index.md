Design system copied from Aprova2.0 project. Fonts: Space Grotesk (display) + DM Sans (body). Dark sidebar with blue accent.

Key design tokens:
- Primary: 217 72% 45% (blue)
- Accent: 160 60% 42% (green)
- Warning: 38 92% 50% (orange)
- Sidebar: dark (220 30% 12%)

App name: **Eixo** (previously Imobilizado+)
- Categorias: Máquinas, Ferramentas, Informática, Móveis e Utensílios, Infraestrutura – Instalações, Veículos
- Setores: Corte Marcenaria, Montagem Marcenaria, Solda, Visual, Fachada, Montagem Externa, Administrativo
- Perfis: Diretor (master), Gestor (all with values), Manutenção (restricted by categories/setores)
- Auth: Supabase email/password login, user creation via edge function `create-user`
- DB tables: categorias, setores, profiles, profile_categorias, profile_setores, bens, bem_extras, manutencoes, manutencao_itens
