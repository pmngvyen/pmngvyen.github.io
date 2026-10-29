# pmngvyen.github.io

Personal site. Plain HTML, CSS and JavaScript with no build step and nothing
to install: open any of the pages in a browser and it runs.

## What is where

    index.html        Home
    about.html        About
    projects.html     Projects
    documents.html    Documents
    links.html        Links

    assets/styles.css   every style on the site
    assets/content.js   the lists you edit to change what the site says
    assets/site.js      builds the page from those lists, and the project sheet
    assets/arm.js       the robot arm: its dial, its kinematics, its drawing
    assets/letters.js   edit mode on Home, where the arm moves the name about
    assets/resume.pdf   your resume, linked from Documents
    assets/favicon.*    the tab icon, drawn as the arm with a blue gripper

Each page is a full document that pulls in the same four assets, so the header,
the drawing frame, the arm and the title block are identical everywhere. The
nav is ordinary links, so every page has its own URL and the back button,
bookmarks and opening a link in a new tab all behave normally.

A page tells the scripts which one it is through `<body data-page="...">`. That
is the only thing that differs between them, besides the section in `<main>`.

## Putting it online

1. Create a repository named `pmngvyen.github.io`. The name has to match your
   username exactly for the site to land at the root of your Pages domain.
2. Upload all five `.html` files, the `assets` folder and `.nojekyll` to the
   top level of that repository. Not inside a subfolder: GitHub Pages serves
   `index.html` from wherever it sits, and only the root gives you a clean URL.
3. Repository Settings, then Pages in the sidebar. Under Build and deployment
   set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Give it a minute, then open https://pmngvyen.github.io

To put it on an existing repository instead, the same steps work and the site
appears at https://pmngvyen.github.io/REPONAME/ .

From a terminal:

    git init
    git add .
    git commit -m "Portfolio site"
    git branch -M main
    git remote add origin https://github.com/pmngvyen/pmngvyen.github.io.git
    git push -u origin main

## Adding your photos

`assets/README.txt` lists the exact filename each image slot is looking for.
Until a file is there the page draws a labelled placeholder in its place, so
the site is fine to publish before you have all of them.

## Editing the content

Open `assets/content.js`. Everything you are likely to change is a plain list
there, and all five pages read from it:

  TABS        the five nav items, and which file each one points at
  ABOUT_FIGS  the photo slots alongside the About blurb
  CAPABILITY  the Capability columns on About, a heading and its list
  INTERESTS   the Interests tiles on About, each with a picture, a label,
              a line of text and an optional shape
  PROJECTS    every project card, in the order they appear. `blurb` is the
              line the tile shows; `body` is the full text, which opens in
              a sheet when the tile is clicked. Leave `blurb` out and the
              tile falls back to the whole of `body`.
  APPS        the deployed web apps, grouped by Games, Learning and Tools
  REPOS       repositories with no site of their own

The projects page lays itself out automatically: every third card is full
width and the two between it are halves, with the full width ones alternating
which side the photo sits on. So adding or removing a project reflows the
page without any other change.

## Resizing the robot arm

At the top of `assets/arm.js` is a block marked ROBOT ARM DIAL.
Every number that decides how big the machine is, how it is proportioned and
how it sits when parked is in there, one per line with a comment saying what
it does and a sensible range. Change one, save, reload. Nothing else in the
file needs touching.

  scale         overall size, 1.00 being as big as the sheet will take
  clamp         how much of that length is the gripper
  upperArm      split between the two links, 0.50 being equal
  thickness     how heavy the castings look
  joints        how big the joint hubs are
  park          the parked pose in degrees, [shoulder, elbow]
  elbow         how far the elbow can travel, [open, folded]
  shoulderRate  how quickly the shoulder chases the cursor
  elbowRate     the same for the elbow, normally the faster of the two
  radius        how far past full stretch the cursor can go before it parks,
                as [home, every other page]
  editScale     how much bigger the arm gets in edit mode, so it can
                reach every letter of the name
  restAfter     seconds of a still mouse before it sits back down
  margin        clearance kept from the left edge of the sheet

The three numbers that matter most are `scale`, `park` and `thickness`. The
rest of the sizing follows from them: the base reseats itself, the arm shrinks
to whatever still fits beside the text, and the drawing keeps its proportions,
at every window width. So the arm stays on the page without you having to
check, and `margin` is the one to raise if you ever do catch it touching an
edge after a large change.

## Edit mode

The Edit button beside the title block on Home grows the arm and makes the
letters of the name loose stock. Put the jaws on a letter and click to take
it, move, then click again to set it down. The jaws stay shut while they are
carrying, so nothing is dropped by moving quickly. Reset puts the letters
back, and Done shrinks the arm and leaves them alone again. Nothing here is
saved: a reload restores the name.

## Replacing the resume

Replace `assets/resume.pdf` with your own file, keeping the name. Nothing else
needs changing: the Open and Download buttons on Documents both point at it.

## Notes

Fonts come from Google Fonts over the network. Everything else, the arm
included, runs locally in the page.
