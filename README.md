# Map of Book

Static visualization for book scripts parsed from files in `data/` (currently *Anna Karenina*, *Effi Briest*, *Gunnlaug*, *The Rider on the White Horse*, and *The World of Yesterday*).

## Navigation

- The root page (`/mapofbook/`) now shows a script overview with one node/card per available script.
- Clicking a script card opens the visualizer.
- Direct links are supported via slug paths, e.g. `/mapofbook/anna_karenina`.

Legacy Lord of the Rings implementation has been preserved in:

- `backup/app.lotr.legacy.js`
- `backup/index.lotr.legacy.html`
- `backup/styles.lotr.legacy.css`

## Local preview

Open `index.html` directly in your browser, or run a simple static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
