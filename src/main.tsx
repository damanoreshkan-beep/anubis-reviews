// Dev entry — mount the widget so `npm run dev` shows the review
// grid pulled from the live Supabase project.
import { render } from 'preact'
import './lib'

const el = document.createElement('anubis-reviews')
el.setAttribute('supabase-url', 'https://ckfinpywlpllvhvzagnw.supabase.co')
el.setAttribute('supabase-key', 'sb_publishable_Bl6csDnCJ5LIJsIsCafMYQ_5zwLTgvR')
document.body.style.padding = '32px'
document.body.style.background = '#040309'
document.body.appendChild(el)

void render
