/** Connect AI: the agent picker, each agent's setup steps, and the desktop Codex hand-off. */
export const connect = {
  blurbClaudeCode: 'Connect from your terminal',
  blurbClaude: 'Add K17 to Claude',
  blurbChatgpt: 'Connect in your browser',
  blurbCodex: 'ChatGPT desktop and Codex CLI',
  blurbCursor: 'Add K17 to Cursor',
  otherClientName: 'Other MCP client',
  headlessName: 'Headless agent or server',
  blurbHeadless: 'n8n, Mastra, CI and scripts, with an agent key',
  blurbOtherClient: 'Use a manual connection',

  chooseTitle: 'Choose your agent',
  chooseLede:
    'Let an agent you already use work on this canvas via MCP. Choose yours to see its connection instructions.',

  pointAtTitle: 'Point it at this canvas',
  pointAtWithPrompt: 'Paste this as your first message. Everything else the agent needs comes from the server.',
  pointAtNoPrompt: 'Open a canvas and tell the agent to work on it. Everything else it needs comes from the server.',
  approveSignInTitle: 'Approve the sign-in',

  claudeCodeLede: 'Three steps, about a minute. Claude Code then designs on this canvas as you.',
  claudeCodeAddTitle: 'Add K17 as an MCP server',
  claudeCodeAddBefore: 'Run this once in any terminal. It registers the ',
  claudeCodeAddAfter: ' server for every project.',
  claudeCodeSignInTitle: 'Sign in from Claude Code',
  claudeCodeSignInBefore: 'Inside Claude Code type ',
  claudeCodeSignInPick: ', pick ',
  claudeCodeSignInThen: ', then ',
  claudeCodeSignInAfter: '. A browser tab opens so you can approve the connection.',

  claudeDesktopLede: 'Add K17 from the desktop app, confirm in Claude, and start designing together.',
  claudeDesktopAddTitle: 'Add K17 to Claude Desktop',
  claudeDesktopAddBody:
    'Click Add to Claude in the K17 desktop app, then confirm the installation in Claude. Your K17 server address is filled in for you.',
  claudeDesktopConnectTitle: 'Connect your K17 account',
  claudeDesktopConnectBody:
    'Enable the extension in Claude. Sign in to K17 in the browser that opens and approve the connection.',
  claudeDesktopPointWithPrompt:
    'Start a new Claude chat, enable K17 in the tools menu, and send this as your first message.',
  claudeDesktopPointNoPrompt:
    'Start a new Claude chat, enable K17 in the tools menu, and tell it which canvas to work on.',

  claudePublicLede: 'Claude’s online connector needs a publicly reachable HTTPS server.',
  claudeLocalTitle: 'Use the desktop connection for this server',
  claudeLocalBody:
    'This K17 address is local or uses HTTP. Choose Desktop app above to connect from your computer, or open K17 at its public HTTPS address.',

  claudeWebLede: 'Add K17 to your Claude account, approve the connection, and start designing. No download needed.',
  claudeWebAddTitle: 'Add K17 to Claude',
  claudeWebAddBody:
    'Open Claude with K17’s name and server address already filled in. Review the details and add the connector.',
  addToClaude: 'Add to Claude',
  claudeWebApproveBody: 'Click Connect on the new connector. A browser tab opens so you can approve the connection.',
  claudeWebPointWithPrompt: 'In a new chat enable K17 under the tools menu and send this as your first message.',
  claudeWebPointNoPrompt: 'In a new chat enable K17 under the tools menu and tell it which canvas to work on.',

  chatgptPublicLede: 'ChatGPT needs a public HTTPS address or a secure tunnel to reach this K17 server.',
  chatgptReachTitle: 'Make your K17 server reachable',
  chatgptReachBody:
    'ChatGPT cannot reach this address directly. Open your public HTTPS K17 address and start this connection there, or configure an OpenAI Secure MCP Tunnel for this server.',
  chatgptGuide: 'View ChatGPT setup guide',

  chatgptLede: 'No download. Open ChatGPT, paste the server address below, and approve the K17 connection.',
  chatgptOpenTitle: 'Open ChatGPT plugins',
  chatgptOpenBefore: 'Click the ',
  chatgptOpenMiddle: ' button on the Plugins page, then ',
  chatgptOpenAfter: '. Your account or workspace must allow custom servers.',
  chatgptOpenButton: 'Open ChatGPT setup',
  chatgptAddTitle: 'Add K17 and sign in',
  chatgptAddBefore: 'Name it ',
  chatgptAddDescribe: ', describe it as a design canvas, and paste this as the MCP server URL. Choose ',
  chatgptAddReview: ', review the permissions, then select ',
  chatgptAddAfter: '. Sign in to K17 when prompted and install the resulting plugin.',
  chatgptPointWithPrompt: 'Start a new chat, type @ and select K17, then send this as your first message.',
  chatgptPointNoPrompt: 'Start a new chat, type @ and select K17, then tell it which canvas to work on.',

  codexLede: 'Add K17 from the desktop app, sign in, and start designing with Codex.',
  codexAddTitle: 'Add K17 to Codex',
  codexAddBody:
    'K17 Desktop configures Codex for you. This works with Codex CLI and the Codex tab in the ChatGPT desktop app.',
  codexSignInTitle: 'Sign in from Codex',
  codexSignInBody:
    'Open a new Codex chat. If K17 needs authentication, sign in from its MCP settings. For Codex CLI, run the command below and approve the connection in your browser.',

  cursorLede: 'Add K17 to Cursor, sign in, and start designing together.',
  cursorAddTitle: 'Add K17 to Cursor',
  cursorAddBody: 'Open Cursor and review the server connection. No file download needed.',
  cursorApproveBody:
    'Enable the K17 server in Cursor and complete its browser sign-in. Your agent can then work on the canvases you can access.',
  cursorPointWithPrompt: 'Open the Agent chat and send this as your first message.',
  cursorPointNoPrompt: 'Open the Agent chat and tell it which canvas to work on.',

  mcpLede: 'K17 is a streamable-HTTP MCP server with OAuth. Any client that supports that can design here.',
  mcpConfigTitle: "Add this server to your client's MCP config",
  mcpConfigBefore: 'Windsurf, Zed, Cline and VS Code all read a JSON file like this. Paste the ',
  mcpConfigAfter: ' entry into it.',
  mcpApproveBody:
    'The first time your client connects, a browser tab opens to authorize it. The agent then works as you, and its edits are attributed to you.',

  connectAgentTitle: 'Connect {name}',
  claudeMethodAria: 'Claude connection method',
  desktopApp: 'Desktop app',
  connectOnline: 'Connect online',
  connectionHelp: 'Connection help',
  helpBefore: 'If Claude asks you to sign in first, return here and click Add to Claude again. You can also use ',
  helpAfter: ' in Claude with this address:',
  mcpMethodAria: 'How the client signs in',
  mcpBrowser: 'Sign in with a browser',
  mcpAgentKey: 'Agent key (headless)',
  agentKeyLede:
    'For agents that run without a person at a browser. The key acts as you, on the canvases you can reach.',
  agentKeyCreateTitle: 'Create an agent key',
  agentKeyCreateBody:
    'Name it after the agent that will use it. Copy the key when it appears: it is shown only once, and you can revoke it there at any time.',
  agentKeyOpen: 'Open Settings → Agent keys',
  agentKeySendTitle: 'Send it with every request',
  agentKeySendBody:
    'Add the server with your key as a bearer header, replacing dpk_… with it. n8n’s MCP Client node, Mastra’s MCPClient and most MCP SDKs take headers like this.',
  done: 'Done',

  arrived: '{name} is here — it worked',
  listening: 'listening for {name}…',
  yourAgent: 'your agent',

  codexSetupTitle: 'Open the matching K17 server',
  codexSetupBody:
    'This setup link is for a different K17 server or is incomplete. Open Connect AI in the desktop app for that server, or use the manual Codex setup in your browser.',
  backToDoop: 'Back to K17',
} as const
