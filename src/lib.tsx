import register from 'preact-custom-element'
import { ReviewsWidget } from './ReviewsWidget'
import css from './widget.css?inline'

// Inject CSS once into document.head. No Shadow DOM — we use Tailwind
// utilities scoped to .aw-reviews-scope, same convention as the auth
// and cabinet widgets, and Shadow DOM would force consumers to copy
// the style block themselves.
const STYLE_ID = 'anubis-reviews-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = css
    document.head.appendChild(el)
}

register(
    ReviewsWidget as any,
    'anubis-reviews',
    ['supabase-url', 'supabase-key', 'limit'],
    { shadow: false },
)
