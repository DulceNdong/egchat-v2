const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withIOSDeploymentTarget = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      console.log('🔧 Checking Podfile at:', podfilePath);
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        // Buscar si ya existe un post_install
        if (podfileContent.includes('post_install do |installer|')) {
          console.log('📝 Found existing post_install hook, modifying it...');
          
          // Insertar nuestro código dentro del post_install existente
          podfileContent = podfileContent.replace(
            /post_install do \|installer\|/,
            `post_install do |installer|
  # Fix iOS deployment target to 15.0 for all pods
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
      
      # Fix fmt library compilation error with Xcode 16
      if target.name == 'fmt'
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
        config.build_settings['GCC_C_LANGUAGE_STANDARD'] = 'c17'
      end
    end
  end
`
          );
        } else {
          console.log('📝 No existing post_install hook, adding new one...');
          
          // Agregar nuestro post_install hook al final
          const postInstallHook = `

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
      
      # Fix fmt library compilation error with Xcode 16
      if target.name == 'fmt'
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
        config.build_settings['GCC_C_LANGUAGE_STANDARD'] = 'c17'
      end
    end
  end
end
`;
          podfileContent += postInstallHook;
        }
        
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('✅ Successfully updated Podfile with iOS 15.0 deployment target and fmt fix');
      } else {
        console.log('⚠️ Podfile not found at:', podfilePath);
      }
      
      return config;
    },
  ]);
};

module.exports = withIOSDeploymentTarget;
