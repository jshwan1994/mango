import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Next.js가 상위 디렉토리의 lockfile을 워크스페이스 루트로 잘못 추론하는 것 방지
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
