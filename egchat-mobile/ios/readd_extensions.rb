#!/usr/bin/env ruby
# Re-integra EGChatNotifService y EGChatShare en EGCHAT.xcodeproj.
# El prebuild 7b5c7fc9 regeneró el proyecto sin ellos, y sin la Notification
# Service Extension iOS deja de adjuntar las fotos de perfil a las notificaciones.
require 'xcodeproj'

PROJ = 'EGCHAT.xcodeproj'
DEPLOYMENT_TARGET = '15.1'
# GENERATE_INFOPLIST_FILE synthesiza CFBundleVersion/ShortVersion desde estos
# valores; deben coincidir con el Info.plist de la app o App Store Connect
# rechaza el binario ("nested bundle version does not match the app").
# Al subir el build number de la app hay que subir también estos dos.
MARKETING_VERSION = '1.0.0'
# Se lee de app.json en cada ejecución: con un número fijado a mano el script
# regresaba las extensiones a 123 cuando la app ya iba por 124 y App Store
# Connect rechazaba el binario.
require 'json'
CURRENT_PROJECT_VERSION = begin
  JSON.parse(File.read('../app.json', encoding: 'UTF-8'))['expo']['ios']['buildNumber'].to_s
rescue StandardError
  abort 'no se pudo leer expo.ios.buildNumber de app.json'
end
project = Xcodeproj::Project.open(PROJ)
app_target = project.targets.find { |t| t.name == 'EGCHAT' } or abort 'no app target'

EXTENSIONS = {
  # La NSE va sin entitlements: la capacidad Communication Notifications vive en
  # la app contenedora, y Apple rechaza capacidades nuevas en el App ID de la
  # extensión cuando EAS las sincroniza con la API key de ASC.
  'EGChatNotifService' => { sources: ['NotificationService.swift'], entitlements: nil },
  'EGChatShare'        => { sources: ['ShareViewController.swift'], entitlements: 'EGChatShare/EGChatShareRelease.entitlements' },
}

EXTENSIONS.each do |name, spec|
  if project.targets.any? { |t| t.name == name }
    puts "#{name}: el target ya existe, se omite"
    next
  end

  target = project.new_target(:app_extension, name, :ios, DEPLOYMENT_TARGET)
  # new_target no crea el grupo de los fuentes: hay que apuntarlo a la carpeta real
  group = project.main_group.find_subpath(name, false) || project.main_group.new_group(name, name)
  group.path = name

  spec[:sources].each do |src|
    ref = group.new_reference(src)
    ref.source_tree = '<group>'
    target.add_file_references([ref])
  end

  target.build_configurations.each do |config|
    bs = config.build_settings
    bs['PRODUCT_BUNDLE_IDENTIFIER']   = "com.jallzstores.egchat.#{name}"
    bs['PRODUCT_NAME']                = '$(TARGET_NAME)'
    bs['MARKETING_VERSION']           = MARKETING_VERSION
    bs['CURRENT_PROJECT_VERSION']     = CURRENT_PROJECT_VERSION
    bs['INFOPLIST_FILE']              = "#{name}/Info.plist"
    bs['GENERATE_INFOPLIST_FILE']     = 'YES'
    bs['INFOPLIST_KEY_CFBundleDisplayName'] = name
    bs['IPHONEOS_DEPLOYMENT_TARGET']  = DEPLOYMENT_TARGET
    bs['TARGETED_DEVICE_FAMILY']      = '1'
    bs['SKIP_INSTALL']                = 'YES'
    bs['SWIFT_VERSION']               = '5.0'
    bs['CODE_SIGN_STYLE']             = 'Automatic'
    bs['LD_RUNPATH_SEARCH_PATHS']     = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
    if spec[:entitlements]
      bs['CODE_SIGN_ENTITLEMENTS'] = spec[:entitlements]
    else
      bs.delete('CODE_SIGN_ENTITLEMENTS')
    end
  end

  app_target.add_dependency(target)
  puts "#{name}: target creado"
end

# Embed Foundation Extensions: sin esta fase el .appex no se copia dentro del .app
embed = app_target.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' }
embed ||= app_target.new_copy_files_build_phase('Embed Foundation Extensions')
embed.dst_subfolder_spec = '13'

EXTENSIONS.each_key do |name|
  target = project.targets.find { |t| t.name == name }
  next unless target
  ref = target.product_reference
  already = embed.files.any? { |bf| bf.file_ref == ref }
  next if already
  build_file = embed.add_file_reference(ref)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  puts "#{name}: embebido en el .app"
end

# order: la app se construye después de sus extensiones (lo gestiona la dependencia)
project.save
puts 'proyecto guardado'
