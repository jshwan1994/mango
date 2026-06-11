'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Banner } from '@/types/database'

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, 5000)
    return () => clearInterval(id)
  }, [banners.length])

  if (banners.length === 0) return null

  return (
    <section className="max-w-5xl w-full mx-auto px-5 pt-3">
      <div className="relative aspect-[3/1] rounded-2xl overflow-hidden bg-[var(--muted)]">
        {banners.map((banner, i) => {
          const inner = (
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className={`object-cover transition-opacity duration-700 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
              priority={i === 0}
            />
          )
          return banner.link_url ? (
            <Link
              key={banner.id}
              href={banner.link_url}
              aria-label={banner.title}
              className="absolute inset-0"
            >
              {inner}
            </Link>
          ) : (
            <div key={banner.id} className="absolute inset-0">{inner}</div>
          )
        })}

        {/* 인디케이터 (1/3 같은 카운터) */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-medium">
            {index + 1}/{banners.length}
          </div>
        )}
      </div>
    </section>
  )
}
