# Mockup Kit Website

Marketing website for **Mockup Kit** (macOS app for App Store screenshot mockups).

## Live Site Structure

- `index.html` - main landing page
- `support.html` - support/help page
- `terms-of-use.html` - legal terms
- `privacy-policy.html` - privacy policy
- `blog/` - blog index and SEO posts (clean folder URLs)
- `robots.txt` - crawl rules and sitemap reference
- `sitemap.xml` - site URL list for search engines
- `Assets/` - logo, screenshots, and App Store badge assets
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow

### Blog routes

- `/blog/`
- `/blog/how-to-make-app-store-screenshots-on-mac/`
- `/blog/best-app-store-screenshot-backgrounds-and-gradients/`
- `/blog/app-store-screenshot-workflow-for-indie-developers/`

## Local Preview

From the project root:

```bash
python3 -m http.server 4173
```

Open:

- `http://127.0.0.1:4173/`

## Deployment

GitHub Actions deploys this repo to GitHub Pages on pushes to `main` using:

- `.github/workflows/deploy-pages.yml`

The workflow packages a minimal `_site/` artifact and deploys it via `actions/deploy-pages`.

## App Store Download Link

The landing page badges point to:

- `https://apps.apple.com/app/id6784220988`

## Contact

- Support: `hi@damastechnologies.com`

