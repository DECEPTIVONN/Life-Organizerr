# Guia de Transições Suaves com Framer Motion (React)

Este guia prático explica detalhadamente como reproduzir a animação suave e profissional de troca de abas em qualquer outro projeto React utilizando a biblioteca **Framer Motion** (ou `motion`).

---

## 🚀 Exemplo Standalone (Código Completo)

Abaixo está um componente funcional completo demonstrando a transição de abas idêntica à do seu Planner:

```tsx
import React, { useState } from 'react';
// Caso utilize a nova versão unificada, use: import { motion, AnimatePresence } from 'motion/react';
// Caso utilize a versão tradicional: import { motion, AnimatePresence } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'home' | 'perfil' | 'configuracoes';

export default function TabNavigator() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-white">Conteúdo da Home</div>;
      case 'perfil':
        return <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-white">Seu Perfil de Usuário</div>;
      case 'configuracoes':
        return <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-white">Configurações Gerais</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      {/* 1. Barra de Navegação */}
      <div className="flex gap-2 mb-6 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
        {(['home', 'perfil', 'configuracoes'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. Container com Animação Fluida */}
      <div className="relative overflow-hidden min-h-[150px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab} // CRÍTICO: Informa ao Framer Motion que a aba mudou
            initial={{ opacity: 0, y: 15 }} // Começa invisível e 15px deslocado para baixo
            animate={{ opacity: 1, y: 0 }}   // Desliza para a posição original e fica visível
            exit={{ opacity: 0, y: -15 }}    // Sai subindo 15px adicionais e desaparecendo
            transition={{ duration: 0.3, ease: "easeInOut" }} // Duração perfeitamente calibrada de 300ms
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

## 🔍 Como Funciona? (Os Três Pilares da Magia)

Para que uma transição entre abas ou telas não cause "pulos" visuais desagradáveis, existem 3 regras de ouro aplicadas aqui:

### 1. `AnimatePresence` com `mode="wait"`
Normalmente, o React monta o novo componente no exato milissegundo em que desmonta o antigo, o que faz os dois aparecerem juntos na tela por um breve instante, quebrando o layout.
*   **O que faz:** O `AnimatePresence` monitora quando filhos diretos do tipo `motion` estão saindo da árvore do React.
*   **Por que o `mode="wait"` é fundamental?** Ele instrui o Framer Motion a **primeiro completar totalmente a animação de saída (`exit`)** do componente antigo, para só então iniciar a animação de entrada (`initial` -> `animate`) do novo componente. Isso elimina qualquer sobreposição visual.

### 2. A Chave Reativa (`key={activeTab}`)
O Framer Motion precisa saber exatamente quando um componente deixou de existir e outro começou a existir para disparar as animações de entrada e saída.
*   **O que faz:** Ao atribuirmos `key={activeTab}` ao nosso `motion.div`, avisamos ao React que, sempre que o estado `activeTab` mudar, o componente anterior deve ser tratado como destruído, e um novo deve ser montado do zero.
*   **Resultado:** Isso dispara os ciclos de vida de animação perfeitamente!

### 3. Ajuste de Coordenadas de Movimento (`initial`, `animate` e `exit`)
Para criar o efeito de "passagem" fluida, nós não apenas alteramos a opacidade (`opacity`), mas também deslocamos o elemento verticalmente com a propriedade `y`:
*   `initial={{ opacity: 0, y: 15 }}`: A nova aba surge de baixo para cima, deslizando suavemente de `y: 15` para `y: 0`.
*   `exit={{ opacity: 0, y: -15 }}`: A aba antiga sai sendo empurrada sutilmente para cima, de `y: 0` para `y: -15`.
*   **Efeito Físico:** Essa discrepância direcional simula um fluxo de profundidade natural e consistente (o conteúdo entra por baixo e flui para cima).

---

## 🛠️ Como instalar no seu outro projeto

1. Adicione a biblioteca ao seu projeto React:
   ```bash
   npm install framer-motion
   # ou
   npm install motion
   ```

2. Certifique-se de que o container externo das abas não possua margens que fiquem colapsando, para garantir que as trocas de altura aconteçam sem saltos secos.
