# Vídeo de divulgação do Baseline — desenho

Aprovado pelo dono em 2026-09-24.

## Objetivo

Um vídeo curto e dinâmico para redes sociais que faça quem joga ou quer jogar basquete (adultos e famílias) ter vontade de treinar com o Baseline.

- **Formato:** vertical 9:16, 1080×1920, 30 fps, MP4 (H.264 + AAC).
- **Público:** quem vai treinar. Tom animado, mostrando o app em uso.
- **Duração:** cerca de 26 s.
- **Som:** o vídeo precisa funcionar mudo (texto na tela). Trilha própria gerada por código (batida + som de drible), sem direitos de terceiros.

## Abordagem

1. **Capturas reais** da demo (`npm run build:demo`) com Playwright, a 390×844 e `deviceScaleFactor` 3, com os perfis fictícios Rafa (adulto) e Léo (10 anos).
2. **Composição no Remotion** (React), com celular desenhado em CSS, movimento feito por animação (rolagem, deslize, indicador de toque, zoom), textos na fonte Breymont (títulos em minúsculas estilizadas, como no app) e Poppins, e as cores do kit do Instituto (Maré `#133358`, `#0b2340`, laranja `#eea047`, amarelo `#f3c44b`, coral `#d96953`, creme `#f8f1e0`).
3. **Trilha** gerada em WAV por um script Node: bumbo e caixa num andamento de cerca de 100 BPM e "drible" (baque grave e curto) sincronizado com os quiques da bola da abertura.

## Roteiro

| Tempo | Cena | Texto |
|---|---|---|
| 0–3 s | Bola do app quica no centro; cada quique revela o texto | "treino de basquete" → "onde você estiver" |
| 3–8 s | Celular na aba Treinos: cartões deslizam, filtro vai para "Sem cesta" | "escolha o treino" · "com ou sem cesta" |
| 8–14 s | Treino guiado: exercício, contagem, descanso | "vídeo do exercício na tela" |
| 14–19 s | Evolução: mapa de fundamentos; "Meta batida!" com confete | "veja sua evolução" · "sem comparar com ninguém" |
| 19–22 s | "Quem vai treinar?" com Rafa e Léo | "para você e para as crianças, a partir de 6 anos" |
| 22–26 s | Tela final | **Baseline by Arvoredo** · "Grátis. Sem anúncios." · @arvoredo.basquetebol |

## Regras

- **Nenhuma foto de pessoa real**, principalmente criança. Só as telas do app com dados fictícios.
- Sem link do site na tela final enquanto o SMTP próprio do Supabase não estiver configurado (hoje o e-mail de confirmação só chega à equipe do projeto).
- O player do YouTube pode não carregar na captura. Se não carregar, a cena do treino usa a tela do modo Foco ou a contagem, e o texto continua o mesmo. Não se inventa imagem de vídeo.
- Nada de comparar atletas; "sem comparar com ninguém" é mensagem do produto.

## Onde fica

- `promo/` na raiz, com `package.json` próprio. Não entra no build nem no `tsconfig` do app.
- `promo/captures/` (PNGs gerados) e `promo/out/` (MP4) ficam no `.gitignore`. Vão para o repositório só o código, o script de captura e o script da trilha.

## Verificação

- Renderizar o MP4 e conferir com `ffprobe` (1080×1920, cerca de 26 s, com trilha de áudio).
- Extrair um quadro de cada cena com ffmpeg e olhar: texto legível, sem corte na área segura das redes (margens de cerca de 120 px em cima e 250 px embaixo), acentos certos.
- Entregar o MP4 ao dono. Commit só com autorização dele.
