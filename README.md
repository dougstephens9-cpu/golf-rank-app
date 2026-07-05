# Fairway Ranks

A mobile-friendly web app for golf enthusiasts to rate the courses they play
(Course / Service / Price, each 1–10, auto-averaged), leave comments, build a
Top 10 list, share it with friends, and search all courses & ratings in the app.

No coding experience assumed — follow the steps below in order. It takes
about 15–20 minutes the first time.

## 1. Create your free backend (Supabase)

1. Go to https://supabase.com and sign up for a free account.
2. Click **New project**. Pick any name (e.g. "fairway-ranks") and a password
   (save it somewhere) and region. Wait ~2 minutes for it to spin up.
3. In the left sidebar, open **SQL Editor** → **New query**.
4. Open the file `supabase_schema.sql` (included in this project), copy
   everything, paste it into the SQL editor, and click **Run**. This creates
   all the tables, security rules, and the auto-scoring logic.
5. In the left sidebar, go to **Settings → API**. You'll need two values from
   this page in the next step:
   - **Project URL**
   - **anon public** key

## 2. Connect the app to your backend

1. In this project folder, copy `.env.example` to a new file named `.env`.
2. Paste in your values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
3. (Optional but recommended) In Supabase, go to **Authentication → Sign In / Providers**
   and under **Email**, turn OFF "Confirm email" if you want to skip email
   verification while testing with friends. You can turn it back on later.

## 3. Run it locally to try it out

You'll need [Node.js](https://nodejs.org) installed (any recent version).

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`) in your browser.
Resize your browser window to a phone width, or open it on your actual phone
(see step 4), to see the mobile layout.

## 4. Try it on your phone

While `npm run dev` is running, it also prints a **Network** URL
(like `http://192.168.x.x:5173`) — open that on your phone's browser if it's
on the same WiFi. Tap the browser's "Share" or menu button and choose
**Add to Home Screen** to install it like a real app icon.

## 5. Put it online so friends can use it (free)

The easiest option is **Vercel**:

1. Push this project to a GitHub repository (create one at github.com, then
   follow GitHub's instructions to push this folder).
2. Go to https://vercel.com, sign up, click **Add New → Project**, and import
   your GitHub repo.
3. When it asks for environment variables, add the same two from your `.env`
   file (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
4. Click **Deploy**. In about a minute you'll get a live URL
   (like `fairway-ranks.vercel.app`) you can text to friends. They can open
   it and "Add to Home Screen" too.

(Netlify works the same way if you prefer it.)

## How the app works

- **Sign up / Sign in** — each person creates an account.
- **Search** (home tab) — search existing courses by name/city/state, or add
  a new course if it's missing.
- **Rate a course** — three sliders (Course, Service, Price, each 1–10) plus
  a comment. The app averages the three into one overall score automatically.
- **My Top 10** — your own rated courses, auto-ranked highest to lowest, with
  a one-tap **Share** button (uses your phone's native share sheet, or copies
  to clipboard on desktop).
- **Friends** — search by username, send/accept friend requests, then view
  any friend's Top 10 list.
- **Course page** — shows the overall average across everyone who's rated it,
  a breakdown by Course/Service/Price, and every reviewer's comment.

## Project structure

```
src/
  pages/         one file per screen (Search, CourseDetail, RateCourse, Top10, Friends, FriendTop10, Profile, Login, Signup)
  components/    reusable UI pieces (ScoreBadge, ScoreSlider, BottomNav, RankedList, TopBar)
  context/       AuthContext (tracks who's logged in)
  lib/           Supabase client setup
supabase_schema.sql   run this once in Supabase's SQL Editor
```

## Ideas for what to add next

- Photo uploads for each course/review (Supabase Storage).
- Push notifications when a friend rates a new course.
- Filter/sort search results by score, distance, or price.
- Public profile pages you can share outside the app.

If you get stuck on any step, just describe what you're seeing and I can help debug it.
