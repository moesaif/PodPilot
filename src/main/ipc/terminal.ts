import { ipcMain, BrowserWindow } from 'electron'
import * as os from 'os'
import * as childProcess from 'child_process'

// node-pty requires native compilation for Electron.
// We use a deferred loader so it only crashes the terminal, not the app.
type IPty = { write: (d: string) => void; resize: (c: number, r: number) => void; kill: () => void; onData: (cb: (d: string) => void) => void; onExit: (cb: () => void) => void }
type PtyModule = { spawn: (file: string, args: string[], opts: object) => IPty }

function loadPty(): PtyModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('node-pty') as PtyModule
    return mod
  } catch {
    return null
  }
}

const terminals = new Map<string, IPty>()

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', async (event, id: string, context?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }

    const pty = loadPty()
    if (!pty) {
      return { error: 'node-pty not compiled. Run: npm run rebuild (requires VS Build Tools)' }
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash')
    const env: Record<string, string> = Object.fromEntries(
      Object.entries(process.env).filter(([, v]) => v !== undefined)
    ) as Record<string, string>

    if (context) env['KUBECONTEXT'] = context

    try {
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: os.homedir(),
        env
      })

      terminals.set(id, term)

      term.onData((data: string) => {
        win.webContents.send(`terminal:data:${id}`, data)
      })

      term.onExit(() => {
        terminals.delete(id)
        win.webContents.send(`terminal:exit:${id}`)
      })

      if (context) {
        const setCtxCmd = os.platform() === 'win32' ? `kubectl config use-context ${context}\r` : `kubectl config use-context ${context}\n`
        term.write(setCtxCmd)
      }

      return { success: true }
    } catch (err) {
      return { error: `Failed to spawn terminal: ${String(err)}` }
    }
  })

  ipcMain.handle('terminal:write', async (_, id: string, data: string) => {
    terminals.get(id)?.write(data)
  })

  ipcMain.handle('terminal:resize', async (_, id: string, cols: number, rows: number) => {
    terminals.get(id)?.resize(cols, rows)
  })

  ipcMain.handle('terminal:destroy', async (_, id: string) => {
    const term = terminals.get(id)
    if (term) { term.kill(); terminals.delete(id) }
  })
}
