# Document Enhancer

Welcome to Document Enhancer! This is a monorepo containing a web interface and an API server for enhancing and processing documents.

## Project Structure

This is a monorepo managed with `pnpm`:

- `artifacts/docbright-web`: The front-end application built with React, Vite, and Tailwind CSS.
- `artifacts/api-server`: The backend API server (if applicable).
- `artifacts/docbright`: Shared utilities or core logic.

## Prerequisites

- Node.js (v18+ recommended)
- `pnpm` (v8+ recommended)

## Installation

```bash
# Install dependencies for the workspace
pnpm install
```

## Running the Application

To run the web interface locally:

```bash
cd artifacts/docbright-web
pnpm run dev
```
Then, open your browser and navigate to the URL provided by Vite.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License.
