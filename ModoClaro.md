Modo Claro: Diretrizes de Design

O modo claro é um tema principal, com identidade própria, e não uma inversão do modo escuro. Ele mantém a mesma estrutura e os mesmos elementos, mas traduz a atmosfera do escuro (brilho de marca, profundidade, contraste) para uma linguagem de papel quente.

1. Princípios
Paridade com o modo escuro. Mesmos elementos, mesmas posições, mesma hierarquia. Só muda a linguagem visual.
Profundidade em vez de planicidade. Superfícies elevadas com sombras difusas em camadas, nunca blocos chapados.
Contornos visíveis. Elementos interativos têm borda clara o suficiente para serem percebidos sem esforço.
Vermelho como assinatura. O vermelho da marca guia o olhar (aba ativa, ação principal, item ativo, ofensiva) e não é usado como decoração.
Nada de branco puro em grandes áreas. O fundo é papel quente, e as superfícies usam um branco levemente quente.
2. Paleta (tokens CSS)
css
:root {
  /* Superfícies */
  --paper:    #F3F0EA;  /* fundo base (papel quente) */
  --surface:  #FDFCFA;  /* cards, botões, filtros */
  --surface2: #F8F6F2;  /* camadas secundárias */

  /* Texto */
  --ink:   #0F172A;     /* títulos, ícones, bordas fortes */
  --muted: #5B6472;     /* datas, legendas, subtítulos */

  /* Bordas */
  --hair:  rgba(15, 23, 42, .13);  /* divisórias suaves */
  --hair2: rgba(15, 23, 42, .22);  /* contorno de cards e botões */

  /* Marca */
  --red:      #E11D48;
  --red2:     #BE123C;  /* texto sobre fundo vermelho claro */
  --redsoft:  #FDECEF;  /* fundo de chips e item ativo */
  --redline:  #F5B3C1;  /* borda de chips e item ativo */

  /* Acentos de categoria */
  --amber:  #D97706;    /* Manhã, arquivo, modo claro ativo */
  --indigo: #4F46E5;    /* Noite */
  --slate:  #475569;    /* Outras tarefas */
}
3. Fundo e atmosfera
Base: degradê vertical 
#F5F2ED → 
#EFEBE4.
Brilho vermelho: radial-gradient(ellipse 55% 45% at 92% -5%, rgba(225,29,72,.13), transparent 70%) (canto superior direito).
Brilho âmbar: radial-gradient(ellipse 45% 40% at 100% 100%, rgba(245,158,11,.10), transparent 70%) (canto inferior direito).
Micro-trama arquitetural (dot matrix grid):
pontos de 1px a cada 32px, cor --ink, opacidade total em torno de 11%;
máscara radial (mask-image) forte no centro e dissolvendo antes das bordas, para não parecer planilha.
css
body::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(15,23,42,.9) 1px, transparent 1.4px);
  background-size: 32px 32px;
  background-position: 16px 16px;
  opacity: .11;
  -webkit-mask-image: radial-gradient(ellipse 62% 58% at 56% 48%, #000 0%, rgba(0,0,0,.55) 45%, transparent 80%);
          mask-image: radial-gradient(ellipse 62% 58% at 56% 48%, #000 0%, rgba(0,0,0,.55) 45%, transparent 80%);
}
4. Componentes
4.1 Barra lateral
Fundo linear-gradient(180deg, #FBF9F6, #F5F2EC), borda direita --hair e sombra lateral suave.
Ícones em --ink (traço 1.8px).
Item ativo: ícone vermelho, fundo --redsoft, borda --redline, sombra vermelha suave e barra lateral vermelha com brilho.
Logo: anel vermelho de 1,5px com leve brilho. Abaixo, uma barra de progresso fina, com o trecho preenchido em vermelho.
4.2 Internal-nav (abas)
Sem contorno preto. Usa uma "calha" rebaixada:
fundo 
#E6E1D9 → 
#ECE8E1;
sombra interna (inset 0 2px 5px rgba(15,23,42,.13));
filete branco de 1px no contorno.
Raio de 16px. Texto das abas inativas em 
#3B4452, 10px, letter-spacing: 1.7px, peso 700.
Aba ativa: degradê #F43F5E → #E11D48 → #BE123C, texto branco, sombra vermelha (0 8px 18px -6px rgba(225,29,72,.6)) e brilho interno superior.
4.3 Cards de tarefa
Raio de 18px; fundo #FFFFFF → --surface.
Borda 1px solid --hair2.
Sombras: inset 0 1px 0 #fff, 0 12px 26px -12px rgba(15,23,42,.28), 0 2px 6px rgba(15,23,42,.06).
Pilha de camadas: duas camadas atrás do card (::before e ::after), mais estreitas e deslocadas para baixo (6px e 11px), com tons 
#F6F3EE e 
#EFEBE4.
Título da tarefa: 16px, peso 700.
4.4 Checkbox
20×20px, raio 6px, fundo branco.
Borda preta de 2px (--ink), com leve sombra.
4.5 Botões, filtros e ícones
Botões quadrados (calendário, engrenagem, expandir): 34×34px, fundo --surface, borda --hair2, sombra curta.
Ícones: traço em --ink (preto), exceto os de categoria e de marca, que usam as cores de acento.
Filtros: pílulas de 30px de altura. A ativa ("Todas") usa degradê grafite #1E293B → #0F172A com texto branco. As inativas usam --surface com borda --hair2.
4.6 Ação principal e FAB
Botão "Adicionar tarefa": degradê #F43F5E → #D01545, ícone + em SVG, raio de 11px, sombra vermelha.
FAB circular de 52px, com o mesmo degradê e sombra vermelha mais ampla.
4.7 Chip de ofensiva
Fundo --redsoft, borda --redline, texto --red2, peso 700.
Ícone de chama em SVG (nunca emoji).
4.8 Cabeçalhos de seção
Ícone da categoria + título (peso 700) + contador em pílula (rgba(15,23,42,.07), texto --muted).
Cores dos ícones: Manhã --amber, Noite --indigo, Outras Tarefas --slate.
4.9 Tipografia
Fonte: Inter (ou Segoe UI como fallback).
Saudação: 30px, peso 800, letter-spacing: -.8px.
Título da página: 25px, peso 700, com "DIÁRIAS" em --red.
Datas e legendas: 12–13px, peso 500, --muted.
5. Regras de uso

Faça

Use --ink para ícones e bordas de checkbox.
Use sombras em camadas, difusas e de baixa opacidade.
Use vermelho apenas para estado ativo, ação principal e ofensiva.
Garanta contraste mínimo AA (4.5:1) para textos.

Não faça

Não use branco puro (#FFF) como fundo de página ou de painéis grandes.
Não use contorno preto na internal-nav.
Não use emojis como ícones.
Não use bordas pretas de 1px em cards. Prefira --hair2 com sombra.
Não aumente a opacidade da trama pontilhada a ponto de ela competir com o conteúdo.
6. Checklist de revisão
 Fundo em papel quente com os dois brilhos nos cantos
 Trama pontilhada mascarada, dissolvendo antes das bordas
 Internal-nav sem contorno preto, com aba ativa vermelha e brilho
 Cards com raio de 18px, borda --hair2 e pilha de camadas
 Checkboxes e ícones com traço preto
 Chama da ofensiva em SVG
 Item ativo da lateral com destaque vermelho
 Mesmos elementos e posições do modo escuro