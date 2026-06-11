# Remote Runner

**Remote Runner** is a VS Code extension that allows you to fetch, preview, and execute shell commands from remote JSON sources directly within a sidebar.

## Installation

Download the `.vsix` file. Open VS Code, go to Extensions (`Ctrl+Shift+X`), click the `…` menu → **Install from VSIX…** and select the file. Or run: `code --install-extension remote-runner-0.0.1.vsix`

## Quick Start

Create a file named `commands.json` with this format:

```json
[
    {
        "label": "Show Date",
        "description": "Displays current date and time",
        "script": "date"
    },
    {
        "label": "List Files",
        "description": "Lists files in current directory",
        "script": "ls -la"
    }
]

Host the file on any HTTP server. For testing: npx serve . --port 3000

Open VS Code settings (Ctrl+,), search remoteRunner, and add your source:

"remoteRunner.sources": [
    {
        "name": "My Commands",
        "url": "http://localhost:3000/commands.json"
    }
]

Click the Remote Runner icon in the Activity Bar, then click the refresh button (🔄). Hover over a command and click 👁️ to preview or ▶️ to run.

Settings
Setting	                Type	Default	Description
remoteRunner.sources	array	[]	    List of sources: { "name": "Example", "url": "https://example.com/commands.json" }
remoteRunner.autoFetch	boolean	false	Automatically fetch commands when VS Code starts.


License
MIT



Author
Djalu A901