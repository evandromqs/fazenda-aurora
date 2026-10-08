# ☀ Fazenda Aurora

> Um jogo 3D de fazenda relaxante e acolhedor para a web, inspirado em *Stardew Valley* e clássicos do gênero *cozy farming*.

[![Jogar Online](https://img.shields.io/badge/Jogar-Online-2ea44f?style=for-the-badge&logo=githubpages&logoColor=white)](https://evandromqs.github.io/fazenda-aurora/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.1-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue?style=for-the-badge)](THREE-LICENSE.txt)

---

## 🎮 Como Jogar

O jogo funciona diretamente no navegador em **computadores e celulares/tablets**:

### 💻 No Computador (Teclado)
- **WASD** ou **Setas**: Caminhar pela fazenda.
- **E**: Interagir (plantar semente, regar canteiro, colher ou abrir mercado).
- **1, 2 e 3**: Escolher o tipo de semente na bolsa.
- **R**: Dormir próximo da casa, recuperar energia e avançar o dia.
- **V**: Alternar entre as 3 câmeras (*Diorama*, *Visão Próxima* e *Vista Aérea*).
- **Q / F**: Girar o ângulo da câmera.
- **Esc**: Pausar / abrir menu principal.

### 📱 No Celular / Tablet (Touch)
- **Joystick Virtual**: Arraste o botão circular no canto inferior esquerdo para se mover em 360°.
- **Botão de Ação**: Botão inteligente no canto inferior direito que se adapta ao contexto (🌱 *Plantar*, 💧 *Regar*, 🥕 *Colher*, 💬 *Falar*, 🏪 *Loja*).
- **Botão Dormir**: Aparece automaticamente ao se aproximar da casa.
- **Botão Câmera**: Alterna rapidamente a visão.

---

## 🌾 Ciclo da Fazenda e Economia

1. **Plante e Regue**: Cada planta consome água para se desenvolver.
   - **Cenouras**: Levam 1 dia para crescer.
   - **Tomates**: Levam 2 dias para crescer.
   - **Abóboras**: Levam 3 dias para crescer.
2. **Durma para Crescer**: Somente plantas que foram regadas no dia anterior crescem ao dormir!
3. **Moradores e Encomendas**:
   - **Lina** (perto do caminho da casa): Compra 3 cenouras por **65 moedas**.
   - **Bento** (ao lado do mercado): Compra 2 tomates por **75 moedas**.
4. **Moedas pelo Caminho**: 12 moedas douradas (valendo 5 moedas cada) surgem pelos caminhos todos os dias.
5. **Meta**: Acumule **500 moedas** para alcançar a meta da fazenda!

---

## 🛠️ Tecnologias e Recursos

- **100% Client-Side**: Sem backend, banco de dados ou dependências externas pesadas.
- **Three.js (0.160.1)**: Gráficos 3D leves com sombras suaves e iluminação dinâmica.
- **Web Audio API**: Efeitos sonoros sintetizados proceduralmente em código puro (sem arquivos de áudio externos).
- **Salvamento Automático**: Progresso gravado no `localStorage` do navegador a cada 5 segundos e após ações.
- **GitHub Pages Ready**: Totalmente compatível com publicação estática imediata.

---

## 📄 Arquivos do Projeto

- `index.html`: Interface e marcação semântica com metatags OpenGraph/SEO e viewport mobile.
- `style.css`: Estilização acolhedora, responsiva com suporte a joystick e botões touch.
- `game.js`: Lógica do jogo, renderização Three.js, inteligência das colheitas e controles.
- `sound.js`: Motor de áudio procedural via Web Audio API.
- `three.min.js`: Motor 3D Three.js empacotado localmente.
- `favicon.svg`: Ícone temático da fazenda em vetor SVG.
