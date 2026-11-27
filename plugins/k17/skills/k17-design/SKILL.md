---
name: k17-design
description: Create, inspect, and refine HTML designs and interactive prototypes on a shared K17 canvas. Use when the user asks to work in K17, provides a k17.dpdns.org canvas URL, or asks to design or implement a UI frame.
---

# K17 Design

Use the connected `k17` MCP server (`https://k17.dpdns.org/mcp`) for K17 canvas work. The server provides the current tool schemas and design guidance; do not substitute local HTML files for edits requested on a shared canvas.

1. Call `get_guide({ topic: "k17-instructions" })` before other K17 tools and follow the returned workflow. Reload it if the conversation has lost that context.
2. Use the canvas ID from the user's `/c/<id>` URL or explicit canvas ID. If they have not identified a canvas, call `list_canvases` and ask them to choose when ambiguous.
3. Pick one `agent_name` and keep it consistent. Read the canvas with `get_canvas`, then fetch its relevant guidelines and references before designing. Announce progress with `set_status`.
4. Make the requested changes through the available K17 MCP tools. Inspect the rendered result with `get_frame_screenshot`, correct visual issues, and respond to feedback from comments on the canvas. Clear your status when finished.
5. Finish with a link to the canvas (`https://k17.dpdns.org/c/<id>`) and a brief summary of the work completed.
