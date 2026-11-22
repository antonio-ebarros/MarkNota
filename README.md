# MarkNota

Bloco de notas minimalista inspirado no **Bloco de Notas do Windows 11**, com edição **Markdown WYSIWYG em tempo real** (no estilo do **MarkText**), **fundo transparente fosco** (integrado ao blur do KDE Plasma no Linux e ao efeito Acrílico/Mica no Windows 11) e **escolha de fonte rápida**.

## Recursos principais

- **Editor Markdown WYSIWYG**: escreva em Markdown com formatação instantânea.
- **Fonte oficial embutida**: `0xProto Nerd Font Mono` (SIL OFL 1.1) para o editor de texto, mais seletor rápido de fontes instaladas no sistema.
- **Transparência fosca**: integração com o desfoque do KDE Plasma no Linux (`Blur KDE`) e com Acrílico/Mica no Windows 11.
- **Multilíngue (`PT` / `EN` / `中文`)**: detecta automaticamente o idioma do sistema (Português, Inglês ou Chinês Simplificado) ou permite escolher manualmente em **Opções → Idioma da interface**.
- **Corretor ortográfico offline (`PT` + `EN`)**: dicionários locais de Português (`pt-BR`) e Inglês (`en-US`) integrados ao menu de botão direito com sugestões de correção em 1 clique e opção *"Adicionar ao dicionário"*.
- **Menu de contexto minimalista**: clique com o botão direito para corrigir palavras, Recortar, Copiar, Colar e Selecionar tudo seguindo o tema atual (Escuro ou Claro Fosco).
- **Diálogos inteligentes**: inicia em `Documentos` ao salvar ou abrir arquivos e lembra a última pasta usada na sessão.

## Como executar em desenvolvimento

```bash
./marknota.sh
```

Ou via npm:

```bash
npm start
```

## Gerar instaladores

```bash
npm run dist:deb       # Pacote .deb (Debian / Ubuntu / KDE Neon)
npm run dist:appimage  # AppImage portátil (Linux)
npm run dist:win       # Instalador NSIS (.exe para Windows)
```

## Atalhos principais

- `Ctrl+T` / `Ctrl+N`: Nova aba
- `Ctrl+O`: Abrir arquivo (`.md`, `.txt`)
- `Ctrl+S`: Salvar
- `Ctrl+Shift+S`: Salvar como
- `Ctrl+W`: Fechar aba
- `Ctrl+F`: Localizar no texto
- `Ctrl++` / `Ctrl+-` / `Ctrl+0`: Zoom
- `Ctrl+Click` em um link: Abrir link no navegador

## Sintaxe Markdown inline (estilo MarkText)

- `# `, `## `, `### `: Títulos
- `**negrito**`, `*itálico*`, `~~riscado~~`, `` `código` ``
- `- ` ou `1. `: Listas
- `- [ ] `: Lista de tarefas interativa
- `> `: Citação
- `---`: Linha divisória
- ```` ``` ````: Bloco de código

## Licença e Autoria

Criado por **Antonio E. Barros** ([antonio-ebarros](https://github.com/antonio-ebarros)). Distribuído sob a licença [MIT](./LICENSE).
