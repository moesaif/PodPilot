/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.podpilot',
  productName: 'PodPilot',
  copyright: 'Copyright © 2024 PodPilot',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: ['out/**'],
  win: {
    executableName: 'PodPilot',
    target: [{ target: 'nsis', arch: ['x64'] }]
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }]
  },
  linux: {
    target: [{ target: 'AppImage' }]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
}
