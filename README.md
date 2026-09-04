# Elestin Edwin Portfolio

A static motion portfolio for Elestin Edwin, organized into Wedding, Corporate, and Reels collections.

## Video hosting

The website loads the video player and card thumbnail for each film directly from the supplied Google Drive files. That keeps video hosting and storage in the original Drive folders:

- [Wedding](https://drive.google.com/drive/folders/1Q9ggNqy97KpFJl_OSEyClvQ4CvUNb3eP)
- [Corporate](https://drive.google.com/drive/folders/17EIbqk4WS5Gt4HNpcT4DnZuGCc-tDxGg)
- [Reels](https://drive.google.com/drive/folders/1YrBIR_c9jiumiudIZ8sDDsPxOk52tVQf)

For visitors to play the videos, each Drive file must remain shared as **Anyone with the link**.

## Live Drive updates

`drive-config.js` can make the film grid refresh directly from all three folders whenever the page opens, then check again every minute. Create a **browser-restricted** Google Cloud API key, enable the **Google Drive API**, and allow `https://elestinedwin.github.io/*` in its website restrictions. Keep `https://tonysigan-rgb.github.io/*` listed too while the previous address is still in use.

Do not use an unrestricted key or an OAuth client secret in this public repository.

## 30-second video thumbnails

The portfolio first looks for a generated still from 00:30 in each video, then falls back to Google Drive's own preview while that still is being created. The GitHub Actions workflow runs every five minutes (the shortest interval GitHub Actions supports) and only generates a new thumbnail for a newly uploaded or modified video.

To activate that job, create a Google Cloud **service account** with the Google Drive API enabled, create a JSON key for it, and share all three video folders with the service account email as a **Viewer**. Add the whole JSON key as the repository Actions secret named `DRIVE_SERVICE_ACCOUNT_JSON`. Keep that JSON out of the repository.

## Publish with GitHub Pages

This is a dependency-free static site. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select the repository's `main` branch and the `/ (root)` folder.
