# Whiskey Log

A tiny personal site: snap a photo of a label on your phone, upload it, add
notes and a rating, and it shows up on your site as a card in a gallery.

Built with **Next.js** (App Router) + **Supabase** (Postgres database + file
storage) and deployed on **Vercel**.

## How it works

- `app/upload/page.js` — mobile-friendly upload form (photo, name, rating, notes)
- `app/api/upload/route.js` — serverless function: saves the photo to Supabase
  Storage, writes a row to the `bottles` table
- `app/page.js` — homepage gallery, reads all bottles from the database
- `app/bottle/[id]/page.js` — detail page for a single bottle

## 1. Set up Supabase

1. Create a free project at https://supabase.com
2. In the SQL editor, run the contents of `supabase-schema.sql` to create the
   `bottles` table
3. In Storage, create a new **public** bucket named `bottle-images`
4. In Project Settings -> API, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this one secret)

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values from
step 1.

```
cp .env.local.example .env.local
```

## 3. Run it locally

```
npm install
npm run dev
```

Visit http://localhost:3000 — you should see an empty gallery and an
"+ Add bottle" link.

## 4. Deploy

1. Push this project to a GitHub repo
2. Import the repo into Vercel (https://vercel.com/new)
3. Add the same three environment variables in the Vercel project settings
   (Settings -> Environment Variables)
4. Deploy

Once it's live, open the Vercel URL on your phone, tap "+ Add bottle," and
your phone's camera will open directly (thanks to `capture="environment"` on
the file input) so you can snap the label and upload in one motion.

## Where to go from here

- **Auto-fetch a nicer bottle photo:** inside `app/api/upload/route.js`,
  before saving the uploaded image, call an image-search API (e.g. Google
  Cloud Vision's Web Detection) using the label photo to try to find a clean
  product shot online, and use that instead if a good match is found —
  falling back to the user's own photo otherwise.
- **Sorting/filtering:** add distillery, price, or type (bourbon, rye, scotch)
  as extra columns on `bottles` and add filter controls to the homepage.
- **Auth:** right now anyone with the URL can add a bottle. Since this is a
  personal project that's probably fine, but Supabase Auth is a
  straightforward add if you want to lock it down later.
