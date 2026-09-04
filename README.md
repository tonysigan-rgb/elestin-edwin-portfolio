# Elestin Edwin Portfolio

A static motion portfolio for Elestin Edwin, organized into Wedding, Corporate, and Reels collections.

## Video hosting

The website loads the video player and card thumbnail for each film directly from the supplied Google Drive files. That keeps video hosting and storage in the original Drive folders:

- [Wedding](https://drive.google.com/drive/folders/1Q9ggNqy97KpFJl_OSEyClvQ4CvUNb3eP)
- [Corporate](https://drive.google.com/drive/folders/17EIbqk4WS5Gt4HNpcT4DnZuGCc-tDxGg)
- [Reels](https://drive.google.com/drive/folders/1YrBIR_c9jiumiudIZ8sDDsPxOk52tVQf)

For visitors to play the videos, each Drive file must remain shared as **Anyone with the link**.

## Live Drive updates

`drive-config.js` can make the film grid refresh directly from all three folders whenever the page opens, then check again every minute. Create a **browser-restricted** Google Cloud API key, enable the **Google Drive API**, restrict the key to `https://tonysigan-rgb.github.io/*`, then add the key to `drive-config.js`.

The key is intentionally blank until it is supplied. Do not use an unrestricted key or an OAuth client secret in this public repository.

## Publish with GitHub Pages

This is a dependency-free static site. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select the repository's `main` branch and the `/ (root)` folder.
