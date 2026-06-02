# Installation

Install TurboDev on your system.

## npm

```bash
npm install -g @rosariomoscato/turbodev
```

## Using npx (no install)

```bash
npx @rosariomoscato/turbodev
```

## From Source

```bash
git clone https://github.com/rosariomoscato/TurboDev.git
cd TurboDev
npm install
npm run build
npm link
```

After installing, run `turbodev` from any project directory.

## Verify Installation

```bash
turbodev --version
```

## First Launch

On first launch, TurboDev will run the **setup wizard** which asks for:

1. **API Key** — Your OpenRouter API key
2. **Model** — Your preferred LLM model

You can re-run the setup at any time with the `/setup` command.
