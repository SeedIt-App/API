# SeedIt

SeetIt - crowd feedback app for all kind of manufacturer products, 
       - building RESTful APIs and microservices using Node.js, Express and MongoDB

## Requirements

 - [Node v8.9+](https://nodejs.org/en/download/current/)
 - [Yarn](https://yarnpkg.com/en/docs/install)

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Narunsrinivas/SeedIt-API.git
cd SeedIt-API
```

Install dependencies:

```bash
yarn
```

Set environment variables:

```bash
cp .env.example .env
```

## Running Locally

```bash
yarn dev
```

## Lint

```bash
# lint code with ESLint
yarn lint

# try to fix ESLint errors
yarn lint:fix

# lint and watch for changes
yarn lint:watch
```

## Test

```bash
# run all tests with Mocha
yarn test

# run unit tests
yarn test:unit

# run integration tests
yarn test:integration

# run all tests and watch for changes
yarn test:watch

# open nyc test coverage reports
yarn coverage
```

## Validate

```bash
# run lint and tests
yarn validate
```

## Documentation

```bash
# generate and open api documentation
yarn docs
```


## License

[MIT License](LICENSE)
