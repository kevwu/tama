const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')


const env = "DEV" // "PI"

let window

app.on('ready', () => {
	// Create the browser window.
	window = new BrowserWindow({frame: false})

	// and load the index.html of the app.
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	// Open the DevTools.
	if(env === "DEV") {
		window.webContents.openDevTools()
	}

	window.on('closed', () => {
		window = null
	})

	if(env === "PI") {
		window.maximize()
		window.setFullScreen(true)
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (window === null) {
		createWindow()
	}
})
