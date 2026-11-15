# MarkNota

Bloco de notas minimalista inspirado no **Bloco de Notas do Windows 11**, com edição **Markdown WYSIWYG em tempo real** (no estilo do **MarkText**), **fundo transparente fosco** (integrado ao blur do KDE Plasma) e **escolha de fonte rápida**.

## Como executar

```bash
./marknota.sh
```

Ou via npm:

```bash
npm start
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
