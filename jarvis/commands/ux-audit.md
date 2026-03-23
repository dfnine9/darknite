---
description: Run a UX walkthrough and QA sweep on a live web app
argument-hint: "[url]"
allowed-tools: "*"
---

Load the `ux-audit` skill and run the audit.

If $ARGUMENTS contains a URL, use it as the starting point. Otherwise, check for a running dev server or ask for the URL.

Walks through the app as a real user via browser automation, flags friction points and usability issues, tests CRUD operations, and produces a ranked audit report.
