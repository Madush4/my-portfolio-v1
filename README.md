# Madusha — Night Shift
React + TypeScript + Vite portfolio. No backend is needed: all current content is local mock data.

## Run in VS Code
Install Node.js 20.19+ or 22.12+, then:
```
npm install
npm run dev
```
Production: `npm run build`, then `npm run preview`.

## Customise
- `src/data.ts`: name, bio, projects, skills, timeline, email, GitHub and LinkedIn.
- `src/style.css`: palette and fonts in `:root`, then layouts and mobile rules.
- `src/sequences.ts`: the two scroll animations (frame folder, file names, **frame count**).
- `src/main.tsx`: page sections and the scroll text timings in `Sequence`.
- `src/motion.ts`: the shared animation loop and smooth-scroll settings (`lerp` controls how much the wheel glides).

## Fonts
Headlines use Bricolage Grotesque, text uses Inter Tight, small data labels use JetBrains Mono. To change the headline font, install another `@fontsource` package, import it in `main.tsx`, and update `--display` in `style.css`.

## Scroll animations
Frames come straight from the original videos as WebP (no ezgif step):
- `public/frames/a` (portrait turn): 75 frames at 1920px. `a-m` is the 960px phone set.
- `public/frames/b` (headphones + keyboard): 121 frames at 1600px. `b-m` is the phone set.

Loading is coarse-first: every 8th frame loads first (the loader waits only for these, about 12 images), then the gaps fill in. If someone scrolls before everything is in, the nearest loaded frame is shown, so the animation never freezes. Neighbouring frames are cross-faded while you scroll.

To re-export from a new video:
```
ffmpeg -i portrait.mp4 -an -vf "scale=1920:-2:flags=lanczos" -c:v libwebp -quality 80 public/frames/a/f%03d.webp
ffmpeg -i portrait.mp4 -an -vf "scale=960:-2:flags=lanczos" -c:v libwebp -quality 72 public/frames/a-m/f%03d.webp
```
Then set `count` in `src/sequences.ts`. For an even smoother result, export a 1080p video at 30 fps or more.

## Projects
Edit them in `src/data.ts`. Each project has `links` (currently `'#'` placeholders) and two optional fields:
- `image: '/projects/smartgov.webp'`: a screenshot in `public/projects/`.
- `video: '/projects/smartgov.mp4'`: a 5 to 8 second silent screen recording that loops.

Until you add them, each card shows a visual drawn in code. On desktop the section pins and the cards slide sideways; on phones it becomes a vertical list.

## UI layer
- `src/timeline.tsx`: the journey as a git graph. Edit milestones in `journey` in `data.ts`: `lane: 'branch'` forks a side branch with its `commits`, `msg` is the line typed in the terminal.
- `src/stack.tsx`: tech groups + 3D sphere. Edit groups and colours in `stack` in `data.ts`.
- `src/fx.tsx`: cursor (inverting blob that becomes a lens over headings, wraps links like a pill, shows "View"/"Drag" labels; magnetic buttons), word-by-word headings (`<Split text="Line one|Line *two*" />`), scroll-reactive marquee.
- `src/finale.tsx`: the closing "I’m ready to build. Are you?" scene.
- `src/polish.css`: styles for all of the above.
- Add your email in `profile.email` in `data.ts` and the big "Let’s talk" button becomes a mailto link.

## Motion and accessibility
Lenis smooths wheel scrolling; keyboard and touch stay native. With "reduce motion" turned on, smooth scrolling, dust, scroll animations and the timeline animation are switched off and the final state is shown. A skip link lets keyboard users bypass the hero.

Project cards open accessible native dialogs. Projects are clearly marked as sample case studies. Contact uses LinkedIn until an email is added. GitHub and project links are '#' placeholders.

## Future backend
Only add a Node/Express service if you need contact submissions, authentication or editing. Never put email-service API secrets in Vite client variables. The current site needs no database or server.
