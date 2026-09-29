# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead: the **Security** tab of this repository, then **Report a vulnerability**.

Worth reporting: anything that lets a page using the kit run script it did not mean to (an attribute, a label or a pasted value that ends up as markup), a pinned file at `/kit/VERSION/` that changes, a request the site or the kit makes to anyone else, or a header that is missing from https://ascii.fedekotek.design.

## What there is to attack

Not much, on purpose.

- **The site** is static files on Vercel. No server code, no accounts, no cookies, no forms that send anything. `site/index.html` carries a Content-Security-Policy with `default-src 'none'` and a hash for every inline script, and `vercel.json` adds HSTS, `frame-ancestors 'none'`, `nosniff` and a strict Permissions-Policy.
- **The kit** is two files with no dependencies. It writes text with `textContent`, and escapes what it draws as markup. The pinned versions under `/kit/VERSION/` never change, and `README.md` gives their `integrity` hashes, so a browser refuses a file that does.
- **Requests**: the page and the kit ask no one else for anything. The one exception is Vercel Web Analytics on the live address, which is cookieless, same origin, and off under Do Not Track or Global Privacy Control.

## Supported versions

The latest kit version gets fixes. A fix ships as a new version; a pinned version is never edited after the fact. The pinned 1.0.0, 1.1.0 and 1.1.1 files load Geist Mono from Google Fonts, as they shipped; 1.2.0 and later make no outside requests.
