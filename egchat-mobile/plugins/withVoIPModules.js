const { withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to inject VoIP Swift modules into iOS project
 */
const withVoIPModules = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosProjectRoot = path.join(projectRoot, 'ios', config.modRequest.projectName);
      
      // Copy Swift modules
      const swiftModules = [
        'EGChatPushKitModule.swift',
        'EGChatPushKitModule.m',
        'EGChatCallModule.swift',
        'EGChatCallModule.m',
        'EGChatAudioRecorder.swift',
        'EGChatAudioRecorder.m'
      ];
      
      const sourcePath = path.join(projectRoot, 'ios-modules');
      
      for (const module of swiftModules) {
        const source = path.join(sourcePath, module);
        const dest = path.join(iosProjectRoot, module);
        
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest);
          console.log(`✅ Copied ${module}`);
        } else {
          console.warn(`⚠️ Source file not found: ${source}`);
        }
      }
      
      return config;
    },
  ]);
};

module.exports = withVoIPModules;
