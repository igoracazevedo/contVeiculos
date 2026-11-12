import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BASE_PATH: isGithubActions ? '/contVeiculos' : '',
  },
  output: isGithubActions ? 'export' : undefined,
  basePath: isGithubActions ? '/contVeiculos' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
