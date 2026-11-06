#!/usr/bin/env bash

set -eox pipefail

echo "🔧 EAS Build Hook: Fixing iOS deployment target..."

# Este hook se ejecuta DESPUÉS de npm install pero ANTES de pod install
# Necesitamos modificar el package.json de RNCAsyncStorage directamente

# Buscar todos los package.json de react-native modules y parchearlos
find node_modules -name "package.json" -path "*/react-native-*" -o -name "package.json" -path "*/@react-native*" | while read package; do
  # Extraer el directorio del paquete
  package_dir=$(dirname "$package")
  
  # Buscar archivos .podspec en ese directorio
  if [ -f "$package_dir"/*.podspec ]; then
    echo "📦 Found React Native module: $package_dir"
  fi
done

# El verdadero fix debe ir en un script que modifique el Podfile DESPUÉS de prebuild
# Crear un script para el post-prebuild
cat > /tmp/fix-podfile.sh << 'FIXSCRIPT'
#!/usr/bin/env bash
set -eox pipefail

echo "🔧 Post-prebuild: Fixing Podfile deployment target..."

cd ios

if [ -f "Podfile" ]; then
  # Agregar post_install hook
  if ! grep -q "config.build_settings\['IPHONEOS_DEPLOYMENT_TARGET'\] = '15.0'" Podfile; then
    cat >> Podfile << 'RUBY'

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end
RUBY
    echo "✅ Added deployment target fix to Podfile"
  fi
  
  echo "📄 Podfile tail:"
  tail -n 10 Podfile
else
  echo "⚠️  Podfile not found yet"
fi
FIXSCRIPT

chmod +x /tmp/fix-podfile.sh

echo "✅ Created post-prebuild fix script"
