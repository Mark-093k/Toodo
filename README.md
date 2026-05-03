# Toodo

Toodo is a local Todo + Gantt schedule manager for project work.

It is available in two formats:

- **Desktop app**: installed on Windows. Data is saved as JSON files in the OS app data directory, not in browser cache.
- **Portable HTML app**: no installation. Open `index.html` directly in Chrome or Edge. Data is saved in browser storage.

## Download

Download the latest preview release from GitHub Releases:

https://github.com/Mark-093k/Toodo/releases

Direct preview downloads:

- Windows desktop installer: https://github.com/Mark-093k/Toodo/releases/download/v0.2.4-date-clipboard-preview/Toodo-desktop-windows-x64-v0.2.4-setup.exe
- Windows desktop MSI: https://github.com/Mark-093k/Toodo/releases/download/v0.2.4-date-clipboard-preview/Toodo-desktop-windows-x64-v0.2.4-msi.msi
- Portable HTML zip: https://github.com/Mark-093k/Toodo/releases/download/v0.2.4-date-clipboard-preview/Toodo-portable.zip

## Which Version Should I Use?

Use the **Desktop app** for real work data.

Desktop data is stored in local JSON files under your user app data folder. It is not removed when browser cache or site data is cleared.

Use the **Portable HTML app** for quick testing or sharing a lightweight preview.

Portable data is stored by the browser. If browser storage is cleared, the data can be lost.

## Desktop App Usage

1. Download the Windows desktop installer from GitHub Releases.
2. Run the installer.
3. Launch Toodo.
4. Use the `Data Folder` button in the app to open the folder where data is stored.

Desktop data is stored in this structure:

```text
ToodoData/
  meta.json
  years/
    2026.json
    2027.json
  backups/
```

The exact base folder depends on your operating system:

- Windows: user AppData directory
- macOS: Application Support directory
- Linux: XDG data directory

## Portable HTML Usage

1. Download `Toodo-portable.zip`.
2. Extract the zip file.
3. Open `Toodo/index.html` by double-clicking it.
4. Use Chrome or Edge.

Node.js, npm, and a development environment are not required.

## Data Backup

Toodo includes Export and Import features.

Use these regularly if your data is important:

- `Export Year`: export the currently selected year.
- `Export All`: export all years.
- `Import Year`: restore one yearly workspace.
- `Import All`: restore all yearly workspaces.

For the portable app, backups are especially important because browser storage can be removed by browser cleanup tools.

## Move Data From Portable to Desktop

1. Open the existing portable Toodo app.
2. Click `Export All`.
3. Install and open the desktop Toodo app.
4. Click `Import All`.
5. Select the JSON file exported from the portable app.

After import, the desktop app stores future changes in its local data folder.

## Main Features

- Editable Todo table
- Gantt view
- Task daily memos
- Yearly workspaces
- Project exclusion periods
- Tentative schedule display with dashed Gantt bars
- Theme switching
- Gantt left panel resizing
- Export / Import backup
- Desktop file-based storage

## Feedback

Please report feedback or issues here:

https://github.com/Mark-093k/Toodo/issues

## Developer Docs

Development, build, release, and storage details are documented in [DEVELOPER.md](./DEVELOPER.md).

Code signing preparation is documented in [SIGNING.md](./SIGNING.md).
