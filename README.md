# Habit Tracker Lite

A small static habit tracker built with plain HTML, CSS, and JavaScript.

## What it does

- Tracks recurring habits month by month
- Lets you edit only today
- Shows streak and daily progress views
- Stores data in browser local storage
- Works well on mobile and desktop

## Run locally

Open `index.html` in a browser, or serve the folder with any simple static server.

## Deploy to GitHub Pages

This repository is compatible with GitHub Pages because it is a static site with an `index.html` entry point.

To publish it:

1. Open the repository settings.
2. Go to **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder.
5. Save the settings and wait for the site to deploy.

The published URL will be:

`https://chadasaiteja.github.io/habit_tracker/`

## Data storage

This app stores habits only in the browser using `localStorage`.
That means data stays on the current browser/device and does not sync automatically across devices.

If browser storage is blocked or unavailable, the app still loads, but changes may not persist.

## Other static hosting options

This repo can also be deployed on:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
