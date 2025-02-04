# Custom kafka module
Since nestjs wrappers do not work fully with the kafkajs library, there was a need to create a library that takes into account all the customizations and features of working with kafkajs
## Features
* [TypeScript](https://www.typescriptlang.org/)
* [Jest](https://jestjs.io/)
* [ESLint](https://eslint.org/)
* [Prettier](https://prettier.io/)
* GitHub Actions
* [Dependabot](https://dependabot.com/)
* Semantic Release
* Commitizen
* Commitlint
* [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
* [Semantic Versioning](https://semver.org/)

## Usage
1. Click the "Use this template" button to create a new repository from this template.
2. Clone the new repository to your local machine.
3. Run `npm install` to install dependencies.
4. Replace name, description, and other fields in `package.json` with your own.
5. Replace the contents of this file with your own.
6. Replace name of package at github actions workflow file

## Scripts
* `npm run build` - Compile TypeScript to JavaScript.
* `npm run lint` - Lint TypeScript files.
* `npm run test` - Run tests.
* `npm run publish:npm` - Publish package to npm.
* `npm run publish:dev` - Publish package to npm with `dev` tag.
