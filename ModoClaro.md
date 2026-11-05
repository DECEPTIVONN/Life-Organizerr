# Modo Claro: Diretrizes de Design

O modo claro é um **tema principal**, com identidade própria, e não uma inversão do modo escuro. Ele mantém a mesma estrutura e os mesmos elementos, mas traduz a atmosfera do escuro (brilho de marca, profundidade, contraste) para uma linguagem de papel quente.

---

## 1. Princípios

1. **Paridade com o modo escuro.** Mesmos elementos, mesmas posições, mesma hierarquia. Só muda a linguagem visual.
2. **Profundidade em vez de planicidade.** Superfícies elevadas com sombras difusas em camadas, nunca blocos chapados.
3. **Contornos visíveis.** Elementos interativos têm borda clara o suficiente para serem percebidos sem esforço.
4. **Vermelho como assinatura.** O vermelho da marca guia o olhar (aba ativa, ação principal, item ativo, ofensiva) e não é usado como decoração.
5. **Nada de branco puro em grandes áreas.** O fundo é papel quente, e as superfícies usam um branco levemente quente.

---

## 2. Paleta (tokens CSS)

```css
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
```

---

## 3. Fundo e atmosfera

- **Base:** degradê vertical `#F5F2ED` → `#EFEBE4`.
- **Brilho vermelho:** `radial-gradient(ellipse 55% 45% at 92% -5%, rgba(225,29,72,.13), transparent 70%)` (canto superior direito).
- **Brilho âmbar:** `radial-gradient(ellipse 45% 40% at 100% 100%, rgba(245,158,11,.10), transparent 70%)` (canto inferior direito).
- **Micro-trama arquitetural (dot matrix grid):**
  - pontos de 1px a cada 32px, cor `--ink`, opacidade total em torno de 11%;
  - máscara radial (`mask-image`) forte no centro e dissolvendo antes das bordas, para não parecer planilha.

```css
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
```

---

## 4. Componentes

### 4.1 Barra lateral
- Fundo `linear-gradient(180deg, #FBF9F6, #F5F2EC)`, borda direita `--hair` e sombra lateral suave.
- Ícones em `--ink` (traço 1.8px).
- **Item ativo:** ícone vermelho, fundo `--redsoft`, borda `--redline`, sombra vermelha suave e barra lateral vermelha com brilho.
- **Logo:** anel vermelho de 1,5px com leve brilho. Abaixo, uma barra de progresso fina, com o trecho preenchido em vermelho.

### 4.2 Internal-nav (abas)
- **Sem contorno preto.** Usa uma "calha" rebaixada:
  - fundo `#E6E1D9` → `#ECE8E1`;
  - sombra interna (`inset 0 2px 5px rgba(15,23,42,.13)`);
  - filete branco de 1px no contorno.
- Raio de 16px. Texto das abas inativas em `#3B4452`, 10px, `letter-spacing: 1.7px`, peso 700.
- **Aba ativa:** degradê `#F43F5E → #E11D48 → #BE123C`, texto branco, sombra vermelha (`0 8px 18px -6px rgba(225,29,72,.6)`) e brilho interno superior.

### 4.3 Cards de tarefa
- Raio de 18px; fundo `#FFFFFF → --surface`.
- Borda `1px solid --hair2`.
- Sombras: `inset 0 1px 0 #fff, 0 12px 26px -12px rgba(15,23,42,.28), 0 2px 6px rgba(15,23,42,.06)`.
- **Pilha de camadas:** duas camadas atrás do card (`::before` e `::after`), mais estreitas e deslocadas para baixo (6px e 11px), com tons `#F6F3EE` e `#EFEBE4`.
- Título da tarefa: 16px, peso 700.

### 4.4 Checkbox
- 20×20px, raio 6px, fundo branco.
- **Borda preta de 2px** (`--ink`), com leve sombra.

### 4.5 Botões, filtros e ícones
- Botões quadrados (calendário, engrenagem, expandir): 34×34px, fundo `--surface`, borda `--hair2`, sombra curta.
- **Ícones:** traço em `--ink` (preto), exceto os de categoria e de marca, que usam as cores de acento.
- **Filtros:** pílulas de 30px de altura. A ativa ("Todas") usa degradê grafite `#1E293B → #0F172A` com texto branco. As inativas usam `--surface` com borda `--hair2`.

### 4.6 Ação principal e FAB
- Botão "Adicionar tarefa": degradê `#F43F5E → #D01545`, ícone `+` em SVG, raio de 11px, sombra vermelha.
- FAB circular de 52px, com o mesmo degradê e sombra vermelha mais ampla.

### 4.7 Chip de ofensiva
- Fundo `--redsoft`, borda `--redline`, texto `--red2`, peso 700.
- Ícone de **chama em SVG** (nunca emoji).

### 4.8 Cabeçalhos de seção
- Ícone da categoria + título (peso 700) + contador em pílula (`rgba(15,23,42,.07)`, texto `--muted`).
- Cores dos ícones: Manhã `--amber`, Noite `--indigo`, Outras Tarefas `--slate`.

### 4.9 Tipografia
- Fonte: Inter (ou Segoe UI como fallback).
- Saudação: 30px, peso 800, `letter-spacing: -.8px`.
- Título da página: 25px, peso 700, com "DIÁRIAS" em `--red`.
- Datas e legendas: 12–13px, peso 500, `--muted`.

---

## 5. Regras de uso

**Faça**
- Use `--ink` para ícones e bordas de checkbox.
- Use sombras em camadas, difusas e de baixa opacidade.
- Use vermelho apenas para estado ativo, ação principal e ofensiva.
- Garanta contraste mínimo AA (4.5:1) para textos.

**Não faça**
- Não use branco puro (`#FFF`) como fundo de página ou de painéis grandes.
- Não use contorno preto na internal-nav.
- Não use emojis como ícones.
- Não use bordas pretas de 1px em cards. Prefira `--hair2` com sombra.
- Não aumente a opacidade da trama pontilhada a ponto de ela competir com o conteúdo.

---

## 6. Checklist de revisão

- [ ] Fundo em papel quente com os dois brilhos nos cantos
- [ ] Trama pontilhada mascarada, dissolvendo antes das bordas
- [ ] Internal-nav sem contorno preto, com aba ativa vermelha e brilho
- [ ] Cards com raio de 18px, borda `--hair2` e pilha de camadas
- [ ] Checkboxes e ícones com traço preto
- [ ] Chama da ofensiva em SVG
- [ ] Item ativo da lateral com destaque vermelho
- [ ] Mesmos elementos e posições do modo escuro

---

## 7. Padrões adicionais (Calendário, Meu Dia, Vida em Resumo)

### 7.1 Seletor segmentado (Ano / Mês / Semana / Dia)
- Mesma "calha" rebaixada da internal-nav: fundo `#E6E1D9 → #ECE8E1`, sombra interna e filete branco.
- Altura de 32px, raio de 16px, texto de 12px, peso 600, cor `#3B4452`.
- Opção ativa em degradê vermelho (`#F43F5E → #BE123C`), texto branco e sombra colorida.

### 7.2 Botões quadrados (adicionar, menu, setas, fechar, lixeira)
- Tamanho de 30 a 42px, raio de 9 a 12px, fundo `--surface`, borda `--hair2`.
- Sombra: `inset 0 1px 0 #fff, 0 4px 10px -4px rgba(15,23,42,.25)`.
- Ícones em `--ink`.

### 7.3 Calendário (visão mensal)
- **Container:** card grande com raio de 22px. O cabeçalho dos dias e as linhas de semana ficam dentro dele.
- **Título do mês:** fonte mono, 22px, peso 600 (ex.: `11 / 2026`). Setas de navegação em botões de 30px.
- **Cabeçalho da grade:** dias da semana em mono, 11px, peso 700, `letter-spacing: .8px`. Domingo e sábado em `--red`. A coluna "SEM." usa 9px em `#8A93A1`. Linha inferior em `--hair2`.
- **Números dos dias:** mono, 14px, peso 600. Fins de semana em `--red`. Dias de outro mês esmaecidos (`#B7BCC6`; fins de semana `#F0A9B8`).
- **Dia selecionado:** célula com fundo `#FFF1F4 → #FDE3E9`, borda `--red`, sombra vermelha e número em círculo de 32px preenchido (degradê vermelho, texto branco).
- **Dia atual (não selecionado):** célula clara com borda `--redline` e número em círculo apenas contornado em `--red`.
- **Indicadores de evento:** pontos de 6px com halo de 3px (mesma cor com 13% de opacidade). Verde `#10B981`, roxo `#8B5CF6`.

### 7.4 Modal / painel "Meu Dia"
- **Fundo:** o mesmo papel quente com os brilhos nos cantos. Não use uma camada escura de sobreposição.
- **Título:** peso 800, 16px, `letter-spacing: .6px`. A data fica abaixo, em mono, peso 700, `--red`.
- **Abas de seção:** ficam dentro de uma calha rebaixada (raio de 20px). Cada aba é um botão elevado (`#FFFFFF → #FBFAF7`, borda `--hair2`) com ícone vermelho. A ativa usa o degradê vermelho, com ícone e texto brancos.
- **Rótulos de campo:** caixa alta, 12px, peso 700, `letter-spacing: .8px`. Contadores em mono, 9px, `#6B7280`.
- **Campo de texto:** efeito rebaixado (`#F6F3EE → #FBFAF7`, sombra interna `inset 0 2px 6px rgba(15,23,42,.10)`) e placeholder em `#7A8392`.
- **Opções de estado (Positivo / Negativo):** botões elevados com borda tingida. Positivo em verde (`rgba(16,185,129,.45)`) com ícone `#059669`. Negativo em vermelho (`rgba(225,29,72,.4)`) com ícone `--red`.
- **Rodapé:** divisória em `--hair2`. "Próximo" é um botão suave (`--redsoft`, borda `--redline`, texto `--red2`). "Salvar Alterações" usa o degradê vermelho de ação principal.

### 7.5 Cards de categoria (Vida em Resumo)
- **Dimensões:** 350×208px, raio de 20px, fundo `#FFFFFF → --surface`.
- **Borda e brilho por categoria:** borda com a cor da categoria a 40% de opacidade (`{cor}66`) e brilho radial no canto superior direito a 10% (`{cor}1A`).
- **Cores por categoria:**
  - Espiritualidade: `#D97706`
  - Corpo & Físico: `#059669`
  - Mente & Intelecto: `#2563EB`
  - Vida Social: `#E11D48`
  - Finanças & Carreira: `#CA8A04`
  - Entretenimento & Lazer: `#7C3AED`
- **Ícone:** caixa de 42px, raio de 12px, borda na cor da categoria, ícone na mesma cor.
- **Título:** caixa alta, 15px, peso 800, `letter-spacing: .8px`. O subtítulo fica em mono, 10px, `#6B7280`.
- **Citação:** itálico, 11px, cor `#334155`, com linha vertical de 1,5px (`--hair2`) à esquerda.
- **Barra de preenchimento:** trilho de 4px (`rgba(15,23,42,.10)`). O preenchimento usa degradê vermelho com brilho. O rótulo "PREENCHIMENTO" e a porcentagem ficam em mono, 8,5px.
- **Imagens de fundo:** o modo escuro usa fotos de fundo nos cards. No claro, substitua-as pelo brilho da categoria. Se usar fotos, aplique um véu claro (≥ 85% de branco).

### 7.6 Painéis laterais (citação, dicas, status)
- **Painel de status (Áreas ativas / Habilidades HUD):** card de 72px de altura com divisória vertical. Rótulos em mono, 8,5px, `letter-spacing: 1px`. Valores em mono, 18 a 20px, e "PREMIUM" em `--red`.
- **Citação:** aspas SVG em `--red` com preenchimento a 18%. Texto em itálico, 13px, peso 600. Autor em mono, 9px, `--red`.
- **Dicas de equilíbrio:** cada item é um mini-card de 43px de altura (borda `--hair2`) com checkbox preta de 15px (borda de 1,8px em `--ink`). O selo "DICAS" é uma pílula cinza (`rgba(15,23,42,.07)`).

### 7.7 Tipografia complementar
- **Fonte mono:** `"JetBrains Mono", "IBM Plex Mono", "DejaVu Sans Mono", monospace`. Use para datas, números, contadores e rótulos técnicos.
- **Rótulo de módulo:** mono, 9px, `letter-spacing: 1.3px`, `--red`, caixa alta (ex.: `MÓDULO DE AUTOCONHECIMENTO`).
- **Título de módulo:** 31px, peso 800, `letter-spacing: -1px`, com ícone vermelho de 30px à esquerda.

### 7.8 Regras extras
- Estados semânticos (positivo/negativo, categorias) usam cor na **borda e no ícone**, nunca em fundos chapados.
- Fundos de modal e páginas cheias repetem o fundo base (papel quente, brilhos e trama), em vez de uma cor lisa.
- Texto longo em cards (citações, descrições) usa `#334155` ou `#475569`, nunca cinza claro.

## 8. Checklist adicional

- [ ] Seletor segmentado com a mesma calha rebaixada da internal-nav
- [ ] Calendário: dia selecionado com círculo vermelho preenchido e dia atual com círculo contornado
- [ ] Calendário: fins de semana em vermelho e dias de outro mês esmaecidos
- [ ] Modal: abas elevadas, campo de texto rebaixado e rodapé com ação principal em vermelho
- [ ] Cards de categoria com borda e brilho na cor da categoria
- [ ] Barra de preenchimento com brilho vermelho apenas quando houver progresso
- [ ] Fonte mono usada só em datas, números e rótulos técnicos

---

## 9. Mobile (Home, Progresso, Meu Dia / Checklist)

Referência: tela de 390px de largura, renderizada em 2x. Todos os tokens das seções anteriores continuam valendo.

### 9.1 Princípios mobile
- **Nunca deixe cards escuros no modo claro.** O erro mais comum é manter o fundo escuro dos cards com texto escuro por cima. Todo card usa a superfície clara (`#FFFFFF → --surface`).
- **Margem lateral de 24px** nas telas de conteúdo (Home e Progresso) e **12px** nas telas de formulário (Meu Dia).
- **Alvos de toque:** botões de pelo menos 30px de altura. Itens de lista com 36px ou mais.
- O fundo base (papel quente, brilhos nos cantos e trama pontilhada) é o mesmo do desktop.

### 9.2 Cabeçalho da Home
- **Saudação:** 29px, peso 800, `letter-spacing: -1px`, com o nome em `--red`.
- **Data:** 14px, `#475569`, com ícone de calendário em `--red` à esquerda.
- **Card de classificação:** 50px de altura, raio de 16px, ícone de troféu em `--red`. Rótulo em mono (9,5px, `letter-spacing: 1.4px`, `#5B6472`) e valor em mono, 13px, peso 700.
- Divisória em gradiente (`.hr`) logo abaixo.

### 9.3 Cards de estatística (Frequência, XP, Checklist, Saldo)
- **Dimensões:** 342px de largura, raio de 20px. Altura de 112px para os cards simples e 124px para os que têm barra.
- **Borda e brilho por categoria:** borda `{cor}66` e brilho radial no canto superior direito `{cor}1C`.
- **Cores:**
  - Frequência: `#E11D48`
  - XP: `#D97706`
  - Checklist: `#059669`
  - Saldo: `#0891B2`
- **Ícone:** caixa de 40px, raio de 12px, fundo `{cor}1A`, borda `{cor}66` e ícone na mesma cor.
- **Rótulo:** mono, 10px, `letter-spacing: 1.4px`, peso 600, `#5B6472`.
- **Valor principal:** mono, 34px, peso 700, `letter-spacing: -1px`. Valores monetários usam 26px. A unidade ("DIAS", "XP TOTAL") fica em 12px, `#5B6472`.
- **Barra de progresso:** 7px de altura, trilho `rgba(15,23,42,.10)` com sombra interna.
  - O preenchimento de XP usa o degradê `#F59E0B → #E11D48` com brilho.
  - A barra fica vazia quando o progresso é zero.
- **Textos de apoio:** mono, 9px, `#5B6472`. O estado positivo ("0% concluído hoje", "+ R$ 3.931") usa `#059669`, peso 700.
- **Fotos de fundo:** o modo escuro usa fotos nos cards. No claro, elas são substituídas pelo brilho da categoria. Se mantiver as fotos, aplique um véu claro com pelo menos 85% de branco.

### 9.4 Cabeçalho de seção com ação ("Foco & Mentalidade")
- Título de 15px, peso 800, com ícone vermelho de 18px. Descrição de 10,5px, `#475569`, com largura máxima em torno de 240px.
- **Botão "Novo Card":** 66×44px, raio de 12px, fundo `--redsoft`, borda `--redline`, texto `--red2` em duas linhas e sombra vermelha suave.

### 9.5 Barra de navegação inferior
- Altura de 72px, fundo `#FFFFFF → #F8F6F2`, topo curvo (`border-radius: 50% 50% 0 0 / 22px 22px 0 0`), borda superior `--hair` e sombra `0 -10px 28px -12px rgba(15,23,42,.25)`.
- Cinco ícones distribuídos de forma uniforme. Os inativos usam `#334155` com 22px.
- **Item ativo (Home):** ícone vermelho de 28px, sublinhado de 26×2px em `--red` com brilho e rótulo em mono, 7,5px, `letter-spacing: 1.2px`, `--red`.

### 9.6 Painéis de progresso (Tempo & Ciclos, Eixos, Mini Calendário)
- **Painel:** 342px de largura, raio de 22px, fundo `#FFFFFF → --surface`, borda `--hair2`. Conteúdo com 20px de margem interna.
- **Cabeçalho:** rótulo em mono (9,5px, `--red`, `letter-spacing: 1.4px`), título de 17px, peso 800, e descrição de 10,5px, `#475569`.
- **Barras de ciclo:** 6px de altura. Cores por ciclo:
  - Dia: `#F43F5E → #E11D48`
  - Semana: `#0891B2`
  - Mês: `#FBBF24 → #F59E0B`
  - Ano: `#059669`
- **Valores à direita (ex.: "63% decorrido"):** mono, 10px, peso 700, na cor do ciclo.
- **Grades de chips (dias da semana e meses):**
  - O contêiner é um mini-card elevado (raio de 12px, branco, borda `--hair2`).
  - Os itens passados usam fundo `{cor}1F` (cerca de 12%), borda `{cor}40` e texto em tom escuro da cor (`#0E7490` ciano, `#047857` verde).
  - O item atual é preenchido com degradê e texto branco, mais sombra colorida.
  - Os itens futuros ficam brancos, com texto `#475569`.
- **Rodapé de painel:** linha `--hair2`, texto em mono, 8,5px, `letter-spacing: 1.6px`, `#5B6472`, centralizado.
- **Atalhos (Meu Dia, Metas Ativas, Vida em Resumo):** linhas de 38px de altura, mini-cards elevados com um ícone de 26px (fundo `{cor}1A`, borda `{cor}55`), título de 12px peso 700 e subtítulo de 8,5px em `#5B6472`. Cores: vermelho, âmbar, ciano.
- **Mini calendário:** grade de 7 colunas, números em mono, 11px, peso 600. O dia atual usa um destaque vermelho em degradê com texto branco e raio de 7px. Cabeçalho dos dias em mono, 10px, `#5B6472`.

### 9.7 Meu Dia mobile (formulário em tela cheia)
- **Barra superior:** pílula de 166×26px com o logo ao centro (anel vermelho de 1,5px).
- **Título e data:** "MEU DIA" a 15px, peso 800. A data fica em mono, 10px, peso 700, `--red`.
- **Botões do topo:** 30×30px. O botão de excluir desabilitado usa fundo `#E4E1DB`, sombra interna e ícone `#8A93A1`.
- **Abas em grade 3×2:** a calha rebaixada tem 92px de altura e as abas 38px, com ícone acima do texto (9,5px, peso 600). A ativa usa o degradê vermelho com brilho.
- **Pager:** pontos de 5px (`rgba(15,23,42,.18)`). O ativo tem 18px de largura, é vermelho e tem brilho. Os rótulos "anterior" e "próximo" ficam em mono, 9,5px, `#475569`.
- **Cabeçalho da lista:** título em caixa alta (9,5px, peso 800, `letter-spacing: .7px`) e contador em mono, `--red`.
- **Campo de nova tarefa:** efeito rebaixado (`#F6F3EE → #FBFAF7`, sombra interna) com botão "Adicionar" elevado ao lado.
- **Itens de tarefa:** 36px de altura, raio de 12px, mini-card elevado. **A checkbox tem borda preta de 2px (`--ink`)**, 16px de tamanho e raio de 5px. A lixeira usa `#7A8392`. Metadados (ex.: "(0/4 etapas)") ficam em mono, 8,5px, `#64748B`.
- **Rodapé fixo:** contêiner com 52px de altura, raio de 12px e borda `--hair2`. Contém "Voltar" (botão branco), "Próximo" (suave, `--redsoft`) e "Salvar" (vermelho, ação principal, alinhado à direita).

### 9.8 Regras extras para mobile
- Use no máximo **um botão vermelho preenchido por tela** (a ação principal). Ações secundárias usam o estilo suave (`--redsoft`) ou o branco elevado.
- Quando a tela tem muito espaço vazio (como a lista do Meu Dia), mantenha o fundo com a trama pontilhada em vez de preencher com cor lisa.
- Estados semânticos continuam só na borda e no ícone (verde = positivo, vermelho = destaque ou alerta).
- Em listas longas, mantenha o espaçamento vertical de 8px entre os cards.

### 9.9 Checklist mobile
- [ ] Nenhum card com fundo escuro
- [ ] Cards de estatística com borda e brilho na cor da categoria
- [ ] Barra de navegação inferior curva, com o item ativo em vermelho e brilho
- [ ] Chips de dia e mês: passados tingidos, atual preenchido, futuros brancos
- [ ] Abas do Meu Dia em grade 3×2, com a ativa em vermelho
- [ ] Checkboxes pretas e lixeiras em cinza
- [ ] Apenas um botão vermelho preenchido por tela

---

## 10. Projetos, Dashboard e Modal de Edição (desktop)

### 10.1 Barra de ferramentas (busca + filtros)
- **Contêiner:** card de 53px de altura, raio de 18px, com os padrões de card da seção 4.3.
- **Campo de busca:** rebaixado (`#F6F3EE → #FBFAF7`, sombra interna), 34px de altura, raio de 11px, ícone de lupa em `--ink` e placeholder em `#6B7280`.
- **Filtros por categoria:** calha rebaixada (mesma da internal-nav, raio de 12px, 36px de altura). Texto em mono, 9,5px, peso 700, `letter-spacing: 1.1px`, `#3B4452`, em caixa alta.
- **Filtro ativo:** degradê grafite `#1E293B → #0F172A`, texto branco e sombra suave. Mantém a mesma convenção dos filtros "Todas / Ativas / Concluídas".
- Confira que o último item não ultrapassa a borda da calha (use `justify-content: space-between` e padding lateral de 10px por item).

### 10.2 Card de projeto
- **Dimensões:** cerca de 348×342px, raio de 18px, fundo `#FFFFFF → #FDFCFA`, borda `--hair2`, sombra `0 16px 32px -16px rgba(15,23,42,.32)`. A grade tem 3 colunas com espaçamento de 22px.
- **Cabeçalho (112px):** gradiente pastel `#FCD9C0 → #EBCFF6 → #CDE8F8` (120°) com duas ondas brancas translúcidas (45% e 70%) na base.
  - Cards com imagem usam um gradiente cinza claro (`#E3E4E8 → #F4F4F6`).
  - Se mantiver as fotos de capa, aplique um véu claro com pelo menos 70% de branco.
- **Pílulas sobre o cabeçalho:** fundo `rgba(255,255,255,.92)`, borda `rgba(15,23,42,.12)` e 25px de altura. A categoria usa mono em `--red` (9px, `letter-spacing: 1.2px`). O ano usa o ícone de calendário e texto em `#B45309`.
- **Botões circulares (editar, favoritar, excluir):** 27px, fundo branco, borda `rgba(15,23,42,.18)` e ícones em `--ink`. A estrela favoritada fica com fundo `#FFF4DC`, borda `#E9C46A` e estrela preenchida em `#F59E0B`.
- **Corpo:**
  - Título de 16px, peso 800.
  - Descrição de 11,5px, `#475569`, `line-height: 19px`.
  - Divisória `--hair`.
  - "Progresso Geral" em 10,5px, com a porcentagem em mono, `--red`.
  - Contadores (camadas, tarefas) em 10,5px, peso 600, com ícones `#475569`.
  - "N/N concluídas" em mono, 9px, `#5B6472`.
- **Barra de progresso:** 6px de altura, trilho `rgba(15,23,42,.10)`.
  - Parcial: `#F97316 → #E11D48`.
  - Completo (100%): `#E11D48 → #F97316`.
  - Ambas com brilho vermelho.
- **Rodapé (41px):** faixa `#F8F6F2 → #F3F0EA` com borda superior `--hair`. "Abrir Quadro Kanban" em mono, 9px, `#5B6472`. "Acessar" em `--red`, peso 700, com chevron.

### 10.3 Menu lateral expandido (255px)
- Mesmo fundo, borda e sombra da barra lateral compacta.
- **Perfil:** avatar de 32px com anel vermelho, nome em 12px peso 700 e "XP Acumulados" em mono, 8,5px, `--red`. Ícone de fixar em `--red`.
- **Barra de XP:** 5px de altura, trilho `rgba(15,23,42,.10)` e preenchimento vermelho com brilho. Abaixo, o XP atual em mono (8px, `#5B6472`) e a ofensiva em `--red`, com chama SVG.
- **Itens do menu:** 48px de altura, raio de 14px, ícone de 18px, título de 12px, peso 600, e subtítulo em mono, 8px, `#5B6472`.
- **Item ativo:** fundo `--redsoft`, borda `--redline`, sombra vermelha suave e barra lateral vermelha com brilho. Ícone em `--red` e título em `--ink`, peso 700.
- **Rolagem:** trilho de 5px (`rgba(15,23,42,.06)`) com indicador `#1E293B`.
- **Rodapé do menu:** divisória `--hair`. Modo Escuro (caixa âmbar), Tela Cheia (ícone sem caixa) e Trancar App (caixa `--redsoft` com ícone `--red`).

### 10.4 Painéis do Dashboard
- **Painéis:** raio de 26px, padrão de card da seção 4.3, com margem interna de 24px.
- **Rótulo:** mono, 9px, `letter-spacing: 1.4px`, `--red`. Título de 17px, peso 700, com chevron `#5B6472` quando houver menu. Link de ação à direita em mono, 10,5px, peso 700, `--red`, com seta.
- **Meta ativa (mini-card):**
  - Altura de 68 a 69px, fundo elevado.
  - Ícone de 28px (fundo `{cor}1A`, borda `{cor}55`). Cores: social `#3B82F6`, tecnologia `#0891B2`, leitura/criatividade `#7C3AED`.
  - Título de 12,5px, peso 700, e etiqueta em mono, 7,5px, na cor da categoria.
  - Contador "N/N ações (N%)" em mono, 10px, `#334155`.
  - Barra de 5px, com preenchimento vermelho e brilho.
- **Métricas financeiras (Receitas e Despesas):** tiles elevados de 65px de altura. Ícone de seta em caixa verde (`#059669`) para receitas e vermelha (`--red`) para despesas. Rótulo em mono (8,5px) e valor em mono, 12,5px, peso 700.
- **Lançamentos:** linhas de 38px de altura, elevadas. O selo "DESP" usa mono, 8px, `#BE123C`, fundo `--redsoft` e borda `--redline`. O valor fica em mono, 12px, alinhado à direita.
- **Saldo disponível:** valor positivo em `#059669`, peso 700.
- **Estado vazio:** painel elevado com texto centralizado, 11px, `#475569`.

### 10.5 Modal de edição (Editar Tarefa)
- **Sobreposição:** quando o modal ocupa quase toda a tela, use um fundo opaco mais escuro e fosco (`#D9D5CD → #CFCBC3`), sem camada preta. O conteúdo do modal permanece no tema claro (papel quente com brilho vermelho no canto superior direito).
- **Contêiner:** margem de 16px, raio de 22px, borda `rgba(255,255,255,.7)` e sombra profunda `0 40px 90px -24px rgba(15,23,42,.5)`.
- **Cabeçalho (69px):** ícone de fechar em `--ink`, título de 17px, peso 800, e selo "ESC para fechar" elevado (21px de altura, 10px). À direita, "Excluir" no estilo suave (`--redsoft`) e "Salvar Tarefa" como botão vermelho de ação principal.
- **Rótulos de campo:** mono, 9,5px, `letter-spacing: 1.3px`, peso 600, `#5B6472`, em caixa alta.
- **Campos de entrada:** rebaixados (`#F6F3EE → #FBFAF7`, sombra interna). O título usa 54px de altura, raio de 16px e texto de 16px, peso 700. O texto livre usa 12,5px em `#7A8392` quando é placeholder.
- **Chips de data e lembretes:** elevados, com 30 a 34px de altura e raio total. O estado ativo ou concluído usa um check em `#D97706`.
- **Prioridade (3 botões):** 34px de altura, raio de 12px. Baixa (`#10B981`), Média (`#F59E0B`) e Alta (`#E11D48`) usam bolinha com halo de 3px.
  - A opção selecionada ganha borda `#F59E0B` de 1,5px, fundo `#FFF8E6 → #FFF1CC`, texto `#92400E` em peso 800 e sombra âmbar.
- **Tags:** chips elevados de 30px, com bolinha de 7px colorida e halo de 3px (`{cor}26`). Cada linha é um contêiner flexível, para controlar a quebra. O botão "+" é circular, elevado e com ícone `--ink`.
- **Rastreador de hábitos:** card elevado de 51px com ícone `--ink`, título de 11,5px peso 700, descrição de 8,5px e checkbox preta de 2px à direita.
- **Coluna dupla:** divisória vertical `--hair2` entre as colunas. A área do corpo é cortada na altura do rodapé, e o conteúdo excedente rola.
- **Rodapé (65px):** faixa `#FAF8F4 → #F4F1EB` com borda superior `--hair2`. "Cancelar" é um texto simples em `#475569` e "Salvar" é o botão vermelho.

### 10.6 Regras extras
- Cores de categoria (projetos, metas, tags) aparecem em ícones, bolinhas, bordas e etiquetas, nunca em fundos chapados grandes. O único gradiente colorido de grande área permitido é o do cabeçalho do card de projeto, em tons pastel.
- O menu lateral expandido e o compacto usam o mesmo estilo de item ativo (fundo `--redsoft`, borda `--redline`, barra vermelha).
- Em modais grandes, o fundo atrás do modal é opaco e fosco, e não um preto translúcido.
- Texto de apoio e subtítulos sempre em `#5B6472` ou mais escuro, para manter o contraste.

### 10.7 Checklist adicional
- [ ] Filtros de categoria dentro da calha, sem cortar o último item
- [ ] Card de projeto com cabeçalho pastel, pílulas brancas e rodapé tingido
- [ ] Barra de progresso do projeto com gradiente e brilho (laranja para vermelho)
- [ ] Menu expandido com subtítulos em mono e item ativo em vermelho suave
- [ ] Metas, receitas e despesas com ícones na cor da categoria
- [ ] Modal com fundo opaco mais escuro e conteúdo em papel quente
- [ ] Prioridade selecionada em âmbar e tags com bolinha e halo