

<h1 align="center">CheckMyGit</h1>

<p align="center">
  <strong>Transform any GitHub profile into a stunning portfolio in seconds.</strong>
</p>

<p align="center">
  <a href="https://checkmygit.com">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

<p align="center">
  <img src="src/lib/assets/readme_img.png" alt="CheckMyGit" width="100%" />
</p>

---

## Features

- **Instant Generation** — Enter any GitHub username, get a beautiful portfolio
- **3 Templates** — GitHub-style sidebar, Bento grid, or Minimal CV layout
- **Contribution Graph** — Full year heatmap visualization
- **Language Stats** — Donut chart breakdown of your tech stack
- **Pinned Projects** — Showcase your best repositories
- **PNG Export** — Download your portfolio as an image
- **Shareable URLs** — `checkmygit.com/username?template=bento`
- **No Auth Required** — Fully open source, no sign-up needed

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 Runes
- **Styling:** Tailwind CSS 4
- **API:** GitHub GraphQL + REST fallback
- **Deployment:** Cloudflare Pages
- **Export:** html-to-image

## Roadmap

- [ ] **Dynamic OG Images** — Satori + Resvg for custom social preview cards
- [ ] **New Templates** — Developer card, Resume/CV, Portfolio grid
- [ ] **UI Polish** — Dark/light theme toggle, animation refinements
- [ ] **PDF Export** — Download portfolio as PDF document
- [ ] **Custom Themes** — User-defined accent colors and fonts

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/whoisyurii/checkmygit.git
   cd checkmygit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then add your GitHub token to `.env`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```
   > Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) with `read:user` scope. Optional but recommended to avoid rate limits.

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [localhost:5173](http://localhost:5173) in your browser.

## Contributing

Contributions welcome! Feel free to open issues or submit PRs.

## License

MIT

---

<p align="center">
  Built with SvelteKit & shipped on Cloudflare
</p>
