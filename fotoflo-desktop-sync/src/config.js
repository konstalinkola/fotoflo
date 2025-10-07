import ConfigStore from 'configstore';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_NAME = 'fotoflo-desktop-sync';
const CONFIG_FILE = join(homedir(), '.fotoflo-desktop-sync.json');

export function createConfigManager() {
  return new ConfigStore(CONFIG_NAME, {
    serverUrl: '',
    apiToken: '',
    projects: [],
    lastSync: null,
    settings: {
      autoStart: false,
      watchInterval: 1000,
      maxRetries: 3,
      supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp']
    }
  });
}

export function getConfigPath() {
  return CONFIG_FILE;
}