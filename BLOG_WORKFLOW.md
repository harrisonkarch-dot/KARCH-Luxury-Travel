# KARCH Journal Workflow

Use this every time you want to publish a new article to the site.

## 1. Duplicate the article template

Copy:

- `blog-post-template.html`

Rename it to something clean like:

- `lake-como-summer-guide.html`
- `best-new-luxury-hotels-2027.html`
- `amalfi-coast-villa-guide.html`

## 2. Fill in the article page

Inside the new file, update:

- `<title>`
- meta description
- canonical URL
- category eyebrow
- article title
- body copy
- sidebar notes

If you want a different hero image style, either:

- reuse one of the existing hero classes already in `styles.css`
- or ask Codex to add a new one for you

## 3. Add the new post to the main blog page

Open:

- `blog.html`

Add a new card inside the `blog-preview-grid`.

Use this snippet:

```html
<article class="blog-card">
  <div class="blog-visual blog-visual-dubai"></div>
  <p class="blog-meta">[Category]</p>
  <h3>[Short blog title for the card]</h3>
  <p>
    [One or two sentence teaser describing the article.]
  </p>
  <a class="button secondary" href="[your-file-name].html">Read Article</a>
</article>
```

## 4. Add the new post to the homepage journal section

Open:

- `index.html`

Find the `Journal` section and add another card to that grid.

Use this snippet:

```html
<article class="blog-card">
  <div class="blog-visual blog-visual-dubai"></div>
  <p class="blog-meta">[Category]</p>
  <h3>[Short blog title for the homepage]</h3>
  <p>
    [One or two sentence teaser describing the article.]
  </p>
  <a class="button secondary" href="[your-file-name].html">Read Article</a>
</article>
```

## 5. Deploy the site

From this project folder run:

```bash
vercel --prod
```

## Easy writing formula

If you want your posts to feel polished and luxury-led, use this rhythm:

1. Open with the feeling of the destination or hotel
2. Explain who the trip is best for
3. Share where you would focus the stay
4. Recommend pacing, dining, and standout experiences
5. Close with your concierge point of view

## Good article ideas

- Best new luxury hotels in a destination
- How to pace five days in a city
- Best hotels for a honeymoon or milestone trip
- Villa versus hotel in a destination
- Best wellness escapes this season
- Where to stay for a luxury family vacation

## Fastest option

If you want, you can just send Codex:

- the destination or hotel
- the tone you want
- your target traveler

and Codex can write the blog page and add it to the site for you.
