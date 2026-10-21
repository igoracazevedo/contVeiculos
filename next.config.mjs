/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: isGithubActions ? 'export' : undefined,
  basePath: isGithubActions ? '/contVeiculos' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
