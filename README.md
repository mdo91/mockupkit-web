# Mockup Kit Website

Marketing website for **Mockup Kit** (macOS app for App Store screenshot mockups).

## Live Site Structure

- `index.html` - main landing page
- `support.html` - support/help page
- `terms-of-use.html` - legal terms
- `privacy-policy.html` - privacy policy
- `Assets/` - logo, screenshots, and App Store badge assets
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow

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

