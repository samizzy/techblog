# Setting up locally

## Installing node manager/installer

https://github.com/Schniz/fnm?tab=readme-ov-file#installation

1. If rust is intalled then `cargo install fnm`
2. Enable zsh integration for fnm by adding the line `eval "$(fnm env --use-on-cd --shell zsh)"` to .zshrc
3. Store node version for a project in dir using `node --version > .node-version`

## Installing node

https://nodejs.org/en/download

1. Download and install Node.js `fnm install 22`
2. Verify the Node.js version `node -v` # Should print "v22.16.0"
3. Download and install pnpm `corepack enable pnpm`
4. Verify pnpm version `pnpm -v`

## Setting up package.json

`package.json` can be setup in 2 ways, using:
1. https://theme-reco.vuejs.press/en/docs/guide/getting-started.html#quick-start (dont forget to choose 2.x)
2. https://theme-reco.vuejs.press/en/docs/guide/package-manager.html (we use pnpm so we include vue as well)


