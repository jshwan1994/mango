import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // 부모 디렉토리의 lockfile을 워크스페이스 루트로 잘못 추론하는 것 방지
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      // 체육관 placeholder 이미지 (시드 데이터, 추후 실사진으로 교체)
      { protocol: 'https', hostname: 'placehold.co' },
      // Supabase Storage (체육관 사진 업로드용, 추후)
      { protocol: 'https', hostname: 'ymntnqrqhexeawztmveq.supabase.co' },
      // 카카오 프로필 사진
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'http', hostname: 't1.kakaocdn.net' },
    ],
  },
}

export default nextConfig
