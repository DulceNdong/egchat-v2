#!/bin/bash

# Este script fuerza el deployment target de iOS a 15.0 en todos los pods
echo "Fixing iOS deployment target in Podfile..."

cd ios

if [ -f "Podfile" ]; then
  # Agregar post_install hook si no existe
  if ! grep -q "post_install" Podfile; then
    cat >> Podfile << 'EOF'

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
      end
    end
  end
end
EOF
    echo "Added post_install hook to Podfile"
  else
    echo "post_install hook already exists in Podfile"
  fi
else
  echo "Podfile not found"
fi
