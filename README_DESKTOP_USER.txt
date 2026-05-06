Toodo Desktop User Guide

How to run
- Download the Windows desktop installer from GitHub Releases.
- Run the installer.
- Administrator rights are not required. If Windows asks for an all-users or machine-wide install, use the user NSIS installer instead.
- Open Toodo from the Start menu or desktop shortcut.
- Node.js, npm, and Rust are not required for users.
- Do not run `npm run dev:desktop`; that is only for developers.
- The installed release app opens as a normal desktop window and does not show a CMD/console window.

Install location
- Toodo uses a current-user Windows installer.
- The app is installed under the user's profile, for example:
  C:\Users\<username>\AppData\Local\Programs\Toodo
- The preview desktop installer is not intended to install into:
  C:\Program Files\Toodo

Where data is stored
- The desktop app stores data as JSON files in the user's AppData Local folder.
- It does not store work data in browser cache.
- It does not write work data into the install folder, Program Files, or the executable folder.
- Use the Data Folder button in the app to open the exact folder.
- The app also shows the active data folder path in the top workspace controls.

Example Windows data folder
- C:\Users\<username>\AppData\Local\<app-identifier>\data

Default structure
- meta.json
- years/{year}.json
- backups/

Backup and restore
- Export Year saves the current year as a JSON backup file.
- Export All saves all yearly workspaces as one JSON backup file.
- Backup Year copies the current year JSON into the backups folder.
- Import Year and Import All restore exported JSON backup files.

Move data from Portable to Desktop
- Open the portable Toodo app.
- Click Export All.
- Open the desktop Toodo app.
- Click Import All.
- Select the exported JSON file.
- Future changes will be stored in the desktop app data folder.

Notes
- Back up important data regularly.
- Avoid manually editing JSON files while the app is open.
- If you need to move data to another PC, use Export All and Import All.
- Removing the desktop app should not be treated as deleting work data. To fully remove data, click Data Folder, verify the folder contents, then delete the data folder manually only if you no longer need it.
- In developer mode, closing the terminal can close the app. This does not apply to the installed release app.
