# f-dns — React + TypeScript prototype

Updated React + TypeScript dummy UI for dynamically changing enclosed networks. Preserves the uploaded UI’s classification tabs, styling, sample inventory, and topology behavior, while adding ticket workflows and demo roles. See PROJECT_CONTEXT.md for the revised scope.

## Run

Use **Node.js 22.12+** (Node 24 also works). No Python or virtual environment is needed.

From the extracted project directory (the one containing `package.json`):

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

## Ticket demonstration

1. Use **Demo user** in the top bar to select **Veronica (Regular user)**.
2. Select **Open ticket** on the overview, service desk, or a device page. Choose Problem, Request, or Device registration. Tickets can relate to an existing device or the network as a whole.
3. Submit the ticket. It appears in My tickets and is saved across refreshes.
4. Switch to **Matt (Admin)**. The Ticket queue shows all requests, with Open/Closed/All filters and search.
5. Open a ticket, enter a resolution, and select **Close ticket**. Requester, timestamps, closer, resolution, and activity remain visible.
6. For a device registration, correct its proposed fields if necessary, enter a decision note, and select **Approve & add device**. It adds exactly one Unknown-status device and closes the ticket. **Close without adding** records a rejection/cancellation without creating a device.
7. Switch back to Veronica to view the outcome in the Closed filter.

Closing tickets does not make offline devices online. Multiple open tickets retain the Online-Open-Ticket marker until the last one is closed. Manual admin recovery leaves tickets open for explicit resolution.

Both regular users and admins can open Upload & export, import Excel directly into demo inventory, and export all devices or a selected network with addresses and metadata. Regular users still cannot directly add individual devices, approve/close tickets, or mark devices online. These checks are present in the demo routes/actions and ticket transition functions, but browser code is not a security boundary. Real authorization must be enforced by your future service. The role switch does not create accounts or enforce network classifications.

## Preserved workflows

- Dashboard with device totals, ticket summaries, network health, and links to incoming requests.
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
localStorage.removeItem('fdns-react-demo-v3');
localStorage.removeItem('fdns-react-demo-v2');
localStorage.removeItem('fdns-demo-role');
location.reload();
```

Data uses `fdns-react-demo-v3`. On first run it migrates your existing v2 inventory, events, and tickets without deleting the v2 copy. Missing legacy ticket timestamps are shown as Not recorded, not fabricated. The selected demo role is persisted separately. Storage belongs to the current browser and origin; use the same hostname and port to retain it.

If npm downloads are unavailable, the included build can be served directly:

```bash
python3 -m http.server 5173 --bind 127.0.0.1 --directory dist
```

Open http://localhost:5173. Source edits require rebuilding with npm.

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

All networks are fictional. Ping results, uptime, health status, notifications, and recovery are simulated. No packets or messages are sent and no DNS records are provisioned. Notifications produce audit entries only. Recovery updates the selected device only; historical uptime is unchanged. The selected demo identity is used in audit entries, but there is no real authentication or background monitoring.

Topology uses inventory parent relationships rather than network discovery. Unknown parent domains appear without a connecting edge. Cyclic relationships are bounded during rendering but should be corrected in the source inventory. The layout is intended for small demonstration networks.

## Source layout

- `src/App.tsx`: application shell, demo role switch, inventory pages, and navigation.
- `src/Tickets.tsx`: ticket list, creation, review, and admin decision forms.
- `src/model.ts`: shared types, import validation, topology calculation, and audit helpers.
- `src/seed.json`: original sample devices.
- `src/styles.css`: original responsive stylesheet.
- `src/main.tsx`: React entry point.
- `src/*.test.*`: model and interaction checks.

Replace browser state with your real service API when integrating the frontend. Keep authentication, DNS provisioning, monitoring, notifications, and authoritative audit storage on the service side.
