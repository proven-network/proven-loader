# Proven Loader

A Webpack loader for importing Proven application code.

## Installation

```bash
npm install --save-dev @proven-network/loader
```

or

```bash
yarn add -D @proven-network/loader
```

## Usage

### With Webpack

Add the loader to your `webpack.config.js`:

```typescript
module.exports = {
  module: {
    rules: [
      {
        test: /\.proven(.js|.ts)$/,
        use: 'proven-loader',
      },
    ],
  },
}
```

### With Next.js

Add the loader to your `next.config.js`:

```typescript
/** @type {import("next").NextConfig} */
const config = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.proven(.js|.ts)$/,
      use: 'proven-loader',
    })

    return config
  },
}

export default config
```
