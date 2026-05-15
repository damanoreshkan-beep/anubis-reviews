// Fetches reviews from Supabase via the REST API (anon role + RLS
// "is_active" policy), then renders the grid of glass cards that
// already lived inline on the partner site. The card styling is
// mirrored here verbatim so the swap is invisible.
//
// We use the REST endpoint directly instead of pulling in
// `@supabase/supabase-js`. A single GET request is plenty, and
// shaving off ~50 KB of client code keeps the widget tiny.
import { useEffect, useState } from 'preact/hooks'
import { copyFor, LANG_BADGE, type T } from './locales'

interface Props {
    supabaseUrl?: string
    supabaseKey?: string
    /** Optional cap on how many reviews to display. */
    limit?: string
    /** UI locale for loading / error copy. The review *content*
     *  always renders in its own source language. */
    lang?: string
}

interface Review {
    id: string
    nick: string
    rating: number
    lang: string
    text: string
    role: string
    sort_order: number
}

// Stale-while-revalidate cache so revisits paint without a network
// round-trip. Reviews change rarely, but we always refetch in the
// background regardless.
const CACHE_KEY = 'aw-reviews-cache'

function readCache(): Review[] | null {
    if (typeof localStorage === 'undefined') return null
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const data = JSON.parse(raw)
        if (!Array.isArray(data)) return null
        return data as Review[]
    } catch { return null }
}

function writeCache(list: Review[]): void {
    if (typeof localStorage === 'undefined') return
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)) } catch { /* quota etc. */ }
}

async function fetchReviews(supabaseUrl: string, supabaseKey: string, limit?: number): Promise<Review[]> {
    const q = new URLSearchParams({
        select: 'id,nick,rating,lang,text,role,sort_order',
        is_active: 'eq.true',
        order: 'sort_order.asc',
    })
    if (limit) q.set('limit', String(limit))
    const r = await fetch(`${supabaseUrl}/rest/v1/reviews?${q}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!r.ok) throw new Error(`rest ${r.status}`)
    return r.json()
}

export function ReviewsWidget({ supabaseUrl, supabaseKey, limit, lang }: Props) {
    const t = copyFor(lang)
    const max = limit ? Number(limit) : undefined
    const url = (supabaseUrl || '').trim()
    const key = (supabaseKey || '').trim()

    const [reviews, setReviews] = useState<Review[] | null>(() => readCache())
    const [loading, setLoading] = useState(reviews === null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!url || !key) {
            setError('missing supabase-url / supabase-key')
            setLoading(false)
            return
        }
        let cancelled = false
        const run = () => fetchReviews(url, key, max)
            .then(list => {
                if (cancelled) return
                writeCache(list)
                setReviews(list)
                setError(null)
            })
            .catch(e => {
                if (cancelled) return
                if (!reviews) setError(String(e?.message ?? e))
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        run()

        // Refresh when the tab regains focus — admin edits via Studio
        // show up the next time the visitor returns to the page.
        const onVisible = () => { if (document.visibilityState === 'visible') run() }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            cancelled = true
            document.removeEventListener('visibilitychange', onVisible)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, key, max])

    if (!url || !key) {
        return <div class="aw-reviews-scope text-sm text-rose-400 text-center py-8">missing supabase-url / supabase-key</div>
    }

    if (loading && (!reviews || reviews.length === 0)) {
        return (
            <div class="aw-reviews-scope">
                <SkeletonGrid t={t} count={max ?? 6} />
            </div>
        )
    }

    if (error && (!reviews || reviews.length === 0)) {
        return (
            <div class="aw-reviews-scope text-center text-sm text-gray-400 py-12">
                <p class="text-rose-400 font-semibold mb-2">{t.errorTitle}</p>
                <p class="text-xs">{t.errorBody}</p>
            </div>
        )
    }

    if (!reviews || reviews.length === 0) {
        return <div class="aw-reviews-scope text-center text-sm text-gray-500 py-12">{t.empty}</div>
    }

    const trimmed = max ? reviews.slice(0, max) : reviews

    return (
        <div class="aw-reviews-scope">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trimmed.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
        </div>
    )
}

function ReviewCard({ review }: { review: Review }) {
    const badge = LANG_BADGE[review.lang] || LANG_BADGE.en
    // Build the star row off the rating column so a future 4-star
    // entry would render correctly without code changes.
    const stars = '★'.repeat(review.rating) + '☆'.repeat(Math.max(0, 5 - review.rating))
    // mc-heads.net derives a deterministic Steve face from any
    // nickname (offline UUID), so each fake nick gets a stable head
    // across reloads.
    const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(review.nick)}/64`
    return (
        <div class="glass rounded-2xl p-6 card-hover relative">
            <span class="absolute top-3 right-3 text-[10px] font-bold tracking-wider text-gray-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5 leading-none flex items-center gap-1">
                <span style="font-size:11px">{badge.flag}</span>{badge.code}
            </span>
            <div class="flex items-center gap-0.5 text-amber-400 mb-3 text-sm leading-none">{stars}</div>
            <p class="text-gray-300 leading-relaxed mb-5">{review.text}</p>
            <div class="flex items-center gap-3 pt-4 border-t border-brand-500/10">
                <img
                    src={avatarUrl}
                    alt={review.nick}
                    class="review-avatar"
                    width="40" height="40"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                />
                <div>
                    <div class="font-semibold text-white">{review.nick}</div>
                    <div class="text-xs text-gray-500">{review.role}</div>
                </div>
            </div>
        </div>
    )
}

function SkeletonGrid({ t, count }: { t: T; count: number }) {
    const items = Array.from({ length: count })
    return (
        <div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((_, i) => (
                    <div key={i} class="glass rounded-2xl p-6 animate-pulse">
                        <div class="h-3 w-20 rounded bg-brand-500/15 mb-3"/>
                        <div class="h-3 w-full rounded bg-brand-500/15 mb-2"/>
                        <div class="h-3 w-4/5 rounded bg-brand-500/15 mb-2"/>
                        <div class="h-3 w-3/4 rounded bg-brand-500/15 mb-6"/>
                        <div class="flex items-center gap-3 pt-4 border-t border-brand-500/10">
                            <div class="w-10 h-10 rounded-full bg-brand-500/15"/>
                            <div class="flex-1">
                                <div class="h-3 w-24 rounded bg-brand-500/15 mb-1"/>
                                <div class="h-2 w-16 rounded bg-brand-500/15"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <p class="text-center text-[11px] text-gray-500 mt-4">{t.loading}</p>
        </div>
    )
}
