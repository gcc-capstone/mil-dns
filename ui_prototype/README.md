# f-dns — React + TypeScript prototype

A close port of the original Flask prototype using React, TypeScript, and Vite. The original CSS, page hierarchy, fictional devices, colors, network tabs, topology layout, and demonstration workflows are preserved.

## Run

Use **Node.js 22.12+** (Node 24 also works). No Python or virtual environment is needed.

From the extracted `fdns-react` directory:

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally http://127.0.0.1:5173).

```bash
npm run build     # TypeScript check and production bundle
npm run preview   # Serve that bundle locally
npm test          # Data validation and React interaction checks
```

The zip also includes a prebuilt `dist/` folder. Serve it through an HTTP static server rather than opening index.html directly. Hash-based navigation supports direct links and refreshes without server rewrite rules. The application has no runtime CDN dependencies; Excel parsing is loaded on demand from the bundled assets.

## Preserved workflows

- Dashboard with device totals, alerts, acknowledgements, network health, and recent activity.
- Device table with network tabs, search, status filtering, IPv4/IPv6, assigned engineers, and errors.
- Add-device form, including new network creation and address validation.
- Clickable topology generated from declared upstream parent domains.
- Device overview with addresses, sample uptime, location, and assigned engineers.
- Metadata tab with audit history, simulated ping, demo notifications, diagnosis notes, and manual demo recovery.
- Working `.xlsx` import and a downloadable sample workbook.

## What changed from Flask

- React components replace Jinja templates; TypeScript handles state, validation, and layout.
- Browser `localStorage` replaces SQLite. Changes survive refreshes in the same browser and origin, but are not shared between users, browsers, or ports. The original Flask database is not migrated.
- Hash routes such as `#/devices/4?tab=metadata` replace Flask routes.
- ExcelJS parses workbooks in the browser. No server is required.

To reset the demo, run this in your browser's developer console and refresh:

```js
localStorage.removeItem('fdns-react-demo-v1');
location.reload();
```

## Spreadsheet format

First worksheet, headers in the first row:

| Column | Required | Description |
|---|---|---|
| name | Yes | Device display name |
| domain | Yes | Unique domain name |
| ipv4 | Yes | IPv4 address |
| network | Yes | Network tab name |
| ipv6 | No | IPv6 address |
| kind | No | Router, Switch, Server, Sensor, Endpoint, etc. |
| engineers | No | Comma-separated engineer names |
| location | No | Physical location |
| parent | No | Upstream device domain for topology |

Use `public/sample-inventory.xlsx` or download the template from Import inventory. Imports support `.xlsx` up to 4 MB and 1,000 rows. Validation rejects invalid addresses, duplicate domains, and duplicate IP addresses within a network. No rows are committed if any row fails validation. New devices have Unknown status. Use literal text values in address and domain columns.

## Demo boundaries

All networks are fictional. Ping results, uptime, health status, notifications, and recovery are simulated. No packets or messages are sent and no DNS records are provisioned. Notifications produce audit entries only. Recovery updates the selected device only; historical uptime is unchanged. The Matt profile is decorative and there is no authentication or background monitoring.

Topology uses inventory parent relationships rather than network discovery. Unknown parent domains appear without a connecting edge. Cyclic relationships are bounded during rendering but should be corrected in the source inventory. The layout is intended for small demonstration networks.

## Source layout

- `src/App.tsx`: application shell, pages, forms, and navigation.
- `src/model.ts`: shared types, import validation, topology calculation, and audit helpers.
- `src/seed.json`: original sample devices.
- `src/styles.css`: original responsive stylesheet.
- `src/main.tsx`: React entry point.
- `src/*.test.*`: model and interaction checks.

Replace browser state with your real service API when integrating the frontend. Keep authentication, DNS provisioning, monitoring, notifications, and authoritative audit storage on the service side.
