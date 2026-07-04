// The reviews themselves stay in their source language (each row has
// its own `lang` column). The locales here only cover the *UI* of the
// widget — currently just the error/empty fallbacks.
import { pickLocale } from '@anubis/core'

export type Locale = 'en' | 'ru' | 'uk' | 'de' | 'pl'

export const COPY = {
    en: {
        loading:    'Loading reviews…',
        errorTitle: 'Couldn’t load reviews',
        errorBody:  'Try again later — they’re hosted on our own infrastructure.',
        empty:      'No reviews yet.',
    },
    ru: {
        loading:    'Загружаем отзывы…',
        errorTitle: 'Не удалось загрузить отзывы',
        errorBody:  'Попробуй позже — они хостятся на нашем сервере.',
        empty:      'Отзывов пока нет.',
    },
    uk: {
        loading:    'Завантажуємо відгуки…',
        errorTitle: 'Не вдалося завантажити відгуки',
        errorBody:  'Спробуй пізніше — вони хостяться на нашому сервері.',
        empty:      'Відгуків поки немає.',
    },
    de: {
        loading:    'Bewertungen werden geladen…',
        errorTitle: 'Bewertungen konnten nicht geladen werden',
        errorBody:  'Bitte später erneut versuchen — sie laufen auf unserer Infrastruktur.',
        empty:      'Noch keine Bewertungen.',
    },
    pl: {
        loading:    'Wczytywanie opinii…',
        errorTitle: 'Nie udało się załadować opinii',
        errorBody:  'Spróbuj później — opinie są hostowane na naszej infrastrukturze.',
        empty:      'Brak opinii.',
    },
} satisfies Record<Locale, Record<string, string>>

export type T = typeof COPY['en']

export function copyFor(lang: string | undefined | null): T {
    return pickLocale(COPY, lang) as unknown as T
}

// Per-review flag rendered in the corner of each card. Pairs the
// emoji flag with the language short-code shown next to it.
export const LANG_BADGE: Record<string, { flag: string; code: string }> = {
    uk: { flag: '🇺🇦', code: 'UA' },
    ru: { flag: '🇷🇺', code: 'RU' },
    en: { flag: '🇬🇧', code: 'EN' },
    de: { flag: '🇩🇪', code: 'DE' },
    pl: { flag: '🇵🇱', code: 'PL' },
}
