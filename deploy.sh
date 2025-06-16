#!/usr/bin/env sh

# abort on errors
set -e

# build
pnpm build

# navigate into the build output directory
cd public

# if you are deploying to a custom domain
echo 'bakacoder.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
git push -f https://github.com/samizzy/samizzy.github.io.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -
