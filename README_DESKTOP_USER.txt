Toodo Desktop User Guide

How to run
- Download the Windows desktop installer from GitHub Releases.
- Run the installer.
- Open Toodo from the Start menu or desktop shortcut.
- Node.js, npm, and Rust are not required for users.

Where data is stored
- The desktop app stores data as JSON files in a local app data folder.
- It does not store work data in browser cache.
- Use the Data Folder button in the app to open the exact folder.

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
