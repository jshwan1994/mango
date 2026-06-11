import Link from 'next/link'
import Image from 'next/image'
import { Star, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import type { Product, ProductCategory } from '@/types/database'

export const metadata = {
  title: '망고샵 — 라켓·셔틀콕 추천',
  description: '망고가 엄선한 배드민턴 장비. 쿠팡 파트너스 제휴.',
}

const CATEGORIES: { key: ProductCategory; label: string; emoji: string }[] = [
  { key: 'racket', label: '라켓', emoji: '🏸' },
  { key: 'shuttlecock', label: '셔틀콕', emoji: '🪶' },
  { key: 'shoes', label: '신발', emoji: '👟' },
  { key: 'apparel', label: '의류', emoji: '👕' },
  { key: 'bag', label: '가방', emoji: '🎒' },
]

async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
    return (data ?? []) as Product[]
  } catch {
    return []
  }
}

export default async function ShopPage() {
  const products = await fetchProducts()
  const featured = products.filter((p) => p.is_featured).slice(0, 6)

  return (
    <div className="flex flex-col flex-1 pb-24">
      <SiteHeader />

      <header className="max-w-5xl w-full mx-auto px-5 pt-6">
        <h1 className="text-2xl font-black text-[var(--brand-dark)]">망고샵</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          망고가 엄선한 배드민턴 장비 · 쿠팡 최저가 연결
        </p>
      </header>

      {/* 카테고리 가로 스크롤 */}
      <section className="max-w-5xl w-full mx-auto px-5 mt-5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/shop?category=${c.key}`}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-white border border-[var(--border)] hover:border-[var(--brand-primary)] transition"
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-xs font-bold text-[var(--brand-dark)]">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 상품 */}
      {featured.length > 0 && (
        <section className="max-w-5xl w-full mx-auto px-5 mt-6">
          <h2 className="text-base font-black text-[var(--brand-dark)] mb-3">
            🥭 망고 추천
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        </section>
      )}

      {/* 전체 상품 */}
      <section className="max-w-5xl w-full mx-auto px-5 mt-6 flex-1">
        <h2 className="text-base font-black text-[var(--brand-dark)] mb-3">
          전체 상품
        </h2>
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-bg-warm)] flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-[var(--brand-primary)]" />
            </div>
            <p className="font-bold text-[var(--brand-dark)]">
              상품을 준비 중이에요
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              곧 만나봐요
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        )}

        <p className="mt-8 text-[10px] text-center text-[var(--muted-foreground)] leading-relaxed">
          망고는 쿠팡 파트너스 활동의 일환으로,<br />
          이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </section>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const image =
    product.image_url ??
    'https://placehold.co/400x400/FFF4E0/3D2817?text=Mango'
  const discount =
    product.price && product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null

  return (
    <li>
      <a
        href={product.partner_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex flex-col bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--brand-primary)] hover:shadow-md transition-all"
      >
        <div className="relative aspect-square bg-[var(--muted)]">
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
          />
        </div>
        <div className="p-3">
          {product.brand && (
            <p className="text-[10px] font-bold text-[var(--brand-primary)] uppercase">
              {product.brand}
            </p>
          )}
          <p className="text-sm font-bold text-[var(--brand-dark)] line-clamp-2 leading-snug">
            {product.name}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            {discount && (
              <span className="text-xs font-black text-[var(--brand-primary)]">
                {discount}%
              </span>
            )}
            {product.price && (
              <span className="text-sm font-black text-[var(--brand-dark)]">
                {product.price.toLocaleString()}원
              </span>
            )}
          </div>
          {product.rating_avg && (
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)] flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-[var(--brand-yellow)] text-[var(--brand-yellow)]" />
              {product.rating_avg} ({product.rating_count.toLocaleString()})
            </p>
          )}
        </div>
      </a>
    </li>
  )
}
