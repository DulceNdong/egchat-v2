Pod::Spec.new do |s|
  s.name = 'CallScreen'
  s.version = '1.0.0'
  s.summary = 'EGCHAT call screen stub plugin for iOS'
  s.license = 'MIT'
  s.homepage = 'https://github.com/DulceNdong/egchat-v2'
  s.author = 'EGCHAT'
  s.source = { :path => '.' }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m}'
  s.ios.deployment_target = '13.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
