# Frontline DNS project context — updated October 22, 2026

The product supports establishing and maintaining a dynamically changing, enclosed network. It is not primarily a static-base monitoring product. Many devices arrive, leave, or become disconnected; rapid device registration and local DNS setup are central workflows. An offline device is not automatically an incident.

Target product: lightweight, locally hosted authoritative DNS with IPv4/IPv6 support, Excel import/export, segmented-network access, registration review and approval, ownership metadata, reachability checks and durable history. Operation must not depend on external services in the field. The planned service is Go-based and containerized.

For this UI iteration, the requested scope is real local demo behavior for opening request/problem tickets, admin closure, and switching between an admin and regular user. Device registration approval implements the revised documentation's request/review/correct/approve workflow. Existing classification tabs, styling, sample inventory, and offline-device topology behavior are preserved from the uploaded UI.

Demo roles: Matt (Admin) reviews the complete queue and approves or closes tickets. Veronica (Regular user) opens and reads her own tickets, browses inventory, and requests device registration. Both roles can upload and export Excel inventory. Admin direct individual-device add is retained; regular users use registration tickets for individual additions.

The role switch is for demonstration, not authentication. Classification labels do not implement security isolation. Real DNS provisioning, network discovery, access enforcement, notifications, and multi-user synchronization are separate integration work. All state lives in browser storage in this prototype.

See docs/project-documentation.md for the supplied project documentation.
