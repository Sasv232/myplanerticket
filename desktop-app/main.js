const { app, BrowserWindow, session, ipcMain, Notification } = require("electron");
const path = require("path");

const SITE_URL = "https://myplanerticket.vercel.app";
const APP_TITLE = "MyPlanerTicket";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 375,
    minHeight: 600,
    title: APP_TITLE,
    icon: path.join(__dirname, "icon.ico"),
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0a0a0a",
      symbolColor: "#e5e5e5",
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    backgroundColor: "#0a0a0a",
    show: false,
  });

  mainWindow.loadURL(SITE_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://myplanerticket.vercel.app")) {
      return { action: "allow" };
    }
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    mainWindow.webContents.loadURL(
      `data:text/html,<html><head><style>body{background:#0a0a0a;color:#e5e5e5;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}div{text-align:center;padding:2rem;}h1{font-size:2rem;margin-bottom:0.5rem;}p{color:#a3a3a3;margin-bottom:1.5rem;}button{background:#3b82f6;color:white;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-size:1rem;cursor:pointer;}button:hover{background:#2563eb;}</style></head><body><div><h1>Нет подключения</h1><p>Проверьте интернет и попробуйте снова</p><button onclick="location.href='${SITE_URL}'">Повторить</button></div></body></html>`
    );
  });

  const ses = mainWindow.webContents.session;
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' https://myplanerticket.vercel.app https://*.supabase.co wss://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://myplanerticket.vercel.app https://*.supabase.co; font-src 'self' https://fonts.gstatic.com;",
        ],
      },
    });
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
  if (url.includes("myplanerticket.vercel.app") || url.includes("supabase.co")) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
