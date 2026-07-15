/**
 * EGChatNativeModules.m
 * Módulos nativos 100% Objective-C para React Native New Architecture
 * Incluye: CallKit, AudioRecorder, LiveActivity
 * No requiere Swift — evita el problema de bridging header con prebuilt RN
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CallKit/CallKit.h>
#import <AVFoundation/AVFoundation.h>

#pragma mark - EGChatCallModule (CallKit)

@interface EGChatCallModule : RCTEventEmitter <RCTBridgeModule, CXProviderDelegate>
@end

@implementation EGChatCallModule {
  CXProvider        *_provider;
  CXCallController  *_callController;
  NSUUID            *_activeCallUUID;
  NSString          *_activeCallId;
}

RCT_EXPORT_MODULE(EGChatCallModule)

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init {
  if (self = [super init]) {
    CXProviderConfiguration *cfg = [[CXProviderConfiguration alloc] init];
    cfg.supportsVideo        = YES;
    cfg.supportedHandleTypes = [NSSet setWithObject:@(CXHandleTypeGeneric)];
    cfg.ringtoneSound        = @"notification.wav";
    _provider       = [[CXProvider alloc] initWithConfiguration:cfg];
    _callController = [[CXCallController alloc] init];
    [_provider setDelegate:self queue:nil];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"callAnswered", @"callRejected", @"callEnded", @"callMuted"];
}

RCT_EXPORT_METHOD(showIncomingCall:(NSString *)callerName
                  callerAvatar:(NSString *)callerAvatar
                  callId:(NSString *)callId
                  isVideo:(BOOL)isVideo) {
  _activeCallUUID = [NSUUID UUID];
  _activeCallId   = callId;
  CXCallUpdate *update        = [[CXCallUpdate alloc] init];
  update.remoteHandle         = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:callerName];
  update.localizedCallerName  = callerName;
  update.hasVideo             = isVideo;
  update.supportsHolding      = NO;
  update.supportsGrouping     = NO;
  update.supportsUngrouping   = NO;
  [_provider reportNewIncomingCallWithUUID:_activeCallUUID
                                    update:update
                                completion:^(NSError *error) {
    if (error) NSLog(@"[CallKit] incoming error: %@", error);
  }];
}

RCT_EXPORT_METHOD(dismissIncomingCall) {
  if (!_activeCallUUID) return;
  [_provider reportCallWithUUID:_activeCallUUID
                       endedAtDate:[NSDate date]
                            reason:CXCallEndedReasonRemoteEnded];
  _activeCallUUID = nil;
}

RCT_EXPORT_METHOD(answerCall:(NSString *)callId) {
  if (!_activeCallUUID) return;
  CXAnswerCallAction *action = [[CXAnswerCallAction alloc] initWithCallUUID:_activeCallUUID];
  [_callController requestTransaction:[[CXTransaction alloc] initWithAction:action]
                           completion:^(NSError *e) {}];
}

RCT_EXPORT_METHOD(rejectCall:(NSString *)callId) {
  if (!_activeCallUUID) return;
  CXEndCallAction *action = [[CXEndCallAction alloc] initWithCallUUID:_activeCallUUID];
  [_callController requestTransaction:[[CXTransaction alloc] initWithAction:action]
                           completion:^(NSError *e) {}];
  _activeCallUUID = nil;
}

RCT_EXPORT_METHOD(endCall:(NSString *)callId) {
  if (!_activeCallUUID) return;
  CXEndCallAction *action = [[CXEndCallAction alloc] initWithCallUUID:_activeCallUUID];
  [_callController requestTransaction:[[CXTransaction alloc] initWithAction:action]
                           completion:^(NSError *e) {}];
  _activeCallUUID = nil;
  _activeCallId   = nil;
}

// CXProviderDelegate
- (void)providerDidReset:(CXProvider *)provider {
  _activeCallUUID = nil;
  _activeCallId   = nil;
}

- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action {
  AVAudioSession *s = [AVAudioSession sharedInstance];
  [s setCategory:AVAudioSessionCategoryPlayAndRecord
            mode:AVAudioSessionModeVoiceChat
         options:AVAudioSessionCategoryOptionAllowBluetooth
           error:nil];
  [s setActive:YES error:nil];
  [action fulfill];
  [self sendEventWithName:@"callAnswered" body:@{@"callId": _activeCallId ?: @""}];
}

- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action {
  [action fulfill];
  [self sendEventWithName:@"callRejected" body:@{@"callId": _activeCallId ?: @""}];
  _activeCallUUID = nil;
  _activeCallId   = nil;
}

- (void)provider:(CXProvider *)provider performSetMutedCallAction:(CXSetMutedCallAction *)action {
  [action fulfill];
  [self sendEventWithName:@"callMuted" body:@{@"muted": @(action.isMuted)}];
}

- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession {
  [audioSession setActive:YES error:nil];
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession {
  [audioSession setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                    error:nil];
}

@end


#pragma mark - EGChatAudioRecorder (AVAudioRecorder)

@interface EGChatAudioRecorder : NSObject <RCTBridgeModule, AVAudioRecorderDelegate>
@end

@implementation EGChatAudioRecorder {
  AVAudioRecorder *_recorder;
  NSURL           *_outputURL;
  NSDate          *_startDate;
}

RCT_EXPORT_MODULE(EGChatAudioRecorder)

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *err = nil;
  [session setCategory:AVAudioSessionCategoryPlayAndRecord
                  mode:AVAudioSessionModeVoiceChat
               options:AVAudioSessionCategoryOptionAllowBluetooth |
                        AVAudioSessionCategoryOptionDefaultToSpeaker
                 error:&err];
  if (err) { reject(@"AUDIO_SESSION", @"No se pudo configurar la sesión", err); return; }
  [session setActive:YES error:&err];
  if (err) { reject(@"AUDIO_SESSION", @"No se pudo activar la sesión", err); return; }

  NSString *name = [NSString stringWithFormat:@"egchat_voice_%ld.m4a", (long)[[NSDate date] timeIntervalSince1970]];
  _outputURL = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:name];

  NSDictionary *settings = @{
    AVFormatIDKey:            @(kAudioFormatMPEG4AAC),
    AVSampleRateKey:          @44100.0,
    AVNumberOfChannelsKey:    @1,
    AVEncoderAudioQualityKey: @(AVAudioQualityHigh),
    AVEncoderBitRateKey:      @128000
  };

  _recorder = [[AVAudioRecorder alloc] initWithURL:_outputURL settings:settings error:&err];
  if (err) { reject(@"RECORDER_INIT", @"No se pudo crear el recorder", err); return; }
  _recorder.delegate          = self;
  _recorder.meteringEnabled   = YES;
  [_recorder record];
  _startDate = [NSDate date];
  resolve(@{@"path": _outputURL.absoluteString, @"recording": @YES});
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!_recorder || !_recorder.recording) {
    reject(@"NOT_RECORDING", @"No hay grabación activa", nil); return;
  }
  NSTimeInterval duration = [[NSDate date] timeIntervalSinceDate:_startDate];
  [_recorder stop];
  [[AVAudioSession sharedInstance] setActive:NO
                                 withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                       error:nil];
  if (!_outputURL) { reject(@"NO_FILE", @"No se encontró el archivo", nil); return; }
  resolve(@{@"uri": _outputURL.absoluteString, @"duration": @(duration), @"mimeType": @"audio/aac"});
  _recorder  = nil;
  _outputURL = nil;
  _startDate = nil;
}

RCT_EXPORT_METHOD(cancelRecording) {
  [_recorder stop];
  [_recorder deleteRecording];
  _recorder  = nil;
  _outputURL = nil;
  _startDate = nil;
  [[AVAudioSession sharedInstance] setActive:NO
                                 withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                       error:nil];
}

RCT_EXPORT_METHOD(getAmplitude:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!_recorder || !_recorder.recording) { resolve(@0); return; }
  [_recorder updateMeters];
  float power      = [_recorder averagePowerForChannel:0]; // -160 … 0 dB
  float normalized = MAX(0.0f, (power + 160.0f) / 160.0f);
  resolve(@((int)(normalized * 32768)));
}

@end


#pragma mark - EGChatLiveActivityModule

@interface EGChatLiveActivityModule : NSObject <RCTBridgeModule>
@end

@implementation EGChatLiveActivityModule {
  NSDate *_callStartDate;
  NSTimer *_timer;
}

RCT_EXPORT_MODULE(EGChatLiveActivityModule)

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(startCallActivity:(NSString *)callId
                  callerName:(NSString *)callerName
                  isVideo:(BOOL)isVideo) {
  _callStartDate = [NSDate date];
  // ActivityKit solo disponible en iOS 16.2+ y requiere Swift
  // El timer actualiza el contador cada segundo via EGChatActivityManagerObjC
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_timer invalidate];
    self->_timer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                   repeats:YES
                                                     block:^(NSTimer *t) {
      if (!self->_callStartDate) return;
      NSInteger elapsed = (NSInteger)[[NSDate date] timeIntervalSinceDate:self->_callStartDate];
      NSLog(@"[LiveActivity] Duración: %lds", (long)elapsed);
    }];
  });
}

RCT_EXPORT_METHOD(updateCallActivity:(double)seconds) {
  NSLog(@"[LiveActivity] Update: %.0fs", seconds);
}

RCT_EXPORT_METHOD(endCallActivity) {
  [_timer invalidate];
  _timer         = nil;
  _callStartDate = nil;
}

@end


#pragma mark - EGChatShareModule (Share Extension / contenido compartido)

@interface EGChatShareModule : RCTEventEmitter <RCTBridgeModule>
@end

@implementation EGChatShareModule {
  NSString *_pendingContent;
}

RCT_EXPORT_MODULE(EGChatShareModule)
+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSArray<NSString *> *)supportedEvents {
  return @[@"sharedContent"];
}

RCT_EXPORT_METHOD(getSharedContent:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // Leer del App Group compartido con la Share Extension
  NSUserDefaults *shared = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.egchat.app"];
  NSString *type = [shared stringForKey:@"shared_type"];
  NSString *text = [shared stringForKey:@"shared_text"];
  NSString *uri  = [shared stringForKey:@"shared_uri"];
  NSString *mime = [shared stringForKey:@"shared_mime"];

  if (!type) { resolve([NSNull null]); return; }

  NSMutableDictionary *content = [NSMutableDictionary dictionary];
  content[@"type"] = type;
  if (text) content[@"text"] = text;
  if (uri)  content[@"uri"]  = uri;
  if (mime) content[@"mimeType"] = mime;
  resolve(content);
}

RCT_EXPORT_METHOD(clearSharedContent) {
  NSUserDefaults *shared = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.egchat.app"];
  [shared removeObjectForKey:@"shared_type"];
  [shared removeObjectForKey:@"shared_text"];
  [shared removeObjectForKey:@"shared_uri"];
  [shared removeObjectForKey:@"shared_mime"];
  [shared synchronize];
}

@end


#pragma mark - EGChatWidgetModule (Home Widget badge count)

@interface EGChatWidgetModule : NSObject <RCTBridgeModule>
@end

@implementation EGChatWidgetModule

RCT_EXPORT_MODULE(EGChatWidgetModule)
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(updateWidget:(NSString *)chatsJson
                  unreadTotal:(NSInteger)unreadTotal) {
  // Actualizar badge de la app
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:unreadTotal];
  });
  // Guardar en App Group para el widget de WidgetKit
  NSUserDefaults *shared = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.egchat.app"];
  if (chatsJson) [shared setObject:chatsJson forKey:@"widget_chats"];
  [shared setInteger:unreadTotal forKey:@"widget_unread"];
  [shared synchronize];
  // Recargar todas las líneas de tiempo del widget
  if (@available(iOS 14.0, *)) {
    Class widgetCenter = NSClassFromString(@"WidgetCenter");
    if (widgetCenter) {
      id center = [widgetCenter performSelector:@selector(shared)];
      [center performSelector:@selector(reloadAllTimelines)];
    }
  }
}

RCT_EXPORT_METHOD(clearWidget) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
  });
  NSUserDefaults *shared = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.egchat.app"];
  [shared removeObjectForKey:@"widget_chats"];
  [shared removeObjectForKey:@"widget_unread"];
  [shared synchronize];
}

@end


#pragma mark - EGChatPushKitModule (VoIP Push para llamadas con app cerrada)

#import <PushKit/PushKit.h>

@interface EGChatPushKitModule : RCTEventEmitter <RCTBridgeModule, PKPushRegistryDelegate>
@end

@implementation EGChatPushKitModule {
  PKPushRegistry *_registry;
}

RCT_EXPORT_MODULE(EGChatPushKitModule)
+ (BOOL)requiresMainQueueSetup { return YES; }

- (NSArray<NSString *> *)supportedEvents {
  return @[@"voipPushReceived", @"voipTokenUpdated"];
}

RCT_EXPORT_METHOD(registerVoIP) {
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_registry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
    self->_registry.delegate     = self;
    self->_registry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
  });
}

// ── PKPushRegistryDelegate ─────────────────────────────────────────

- (void)pushRegistry:(PKPushRegistry *)registry
didUpdatePushCredentials:(PKPushCredentials *)credentials
             forType:(PKPushType)type {
  if (![type isEqualToString:PKPushTypeVoIP]) return;
  NSData *tokenData = credentials.token;
  NSMutableString *token = [NSMutableString string];
  const unsigned char *bytes = (const unsigned char *)tokenData.bytes;
  for (NSUInteger i = 0; i < tokenData.length; i++) {
    [token appendFormat:@"%02x", bytes[i]];
  }
  [self sendEventWithName:@"voipTokenUpdated" body:@{@"token": token}];
}

- (void)pushRegistry:(PKPushRegistry *)registry
didReceiveIncomingPushWithPayload:(PKPushPayload *)payload
             forType:(PKPushType)type
withCompletionHandler:(void (^)(void))completion {
  if (![type isEqualToString:PKPushTypeVoIP]) { completion(); return; }

  NSDictionary *data     = payload.dictionaryPayload;
  NSString *callId       = data[@"callId"]     ?: @"";
  NSString *callerName   = data[@"callerName"] ?: @"Llamada entrante";
  NSString *callType     = data[@"callType"]   ?: @"audio";
  BOOL isVideo           = [callType isEqualToString:@"video"];

  // Mostrar llamada nativa via CallKit
  EGChatCallModule *callModule = [self.bridge moduleForName:@"EGChatCallModule"];
  if (callModule) {
    [callModule showIncomingCall:callerName
                   callerAvatar:@""
                         callId:callId
                        isVideo:isVideo];
  }

  // Notificar a JS para que inicie WebRTC
  [self sendEventWithName:@"voipPushReceived" body:data];

  completion();
}

- (void)pushRegistry:(PKPushRegistry *)registry
didInvalidatePushTokenForType:(PKPushType)type {}

@end


#pragma mark - EGChatRichNotification (Notificaciones ricas iOS)

#import <UserNotifications/UserNotifications.h>

@interface EGChatRichNotification : NSObject <RCTBridgeModule>
@end

@implementation EGChatRichNotification

RCT_EXPORT_MODULE(EGChatRichNotification)
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(show:(NSDictionary *)payload) {
  // En iOS las notificaciones ricas se manejan via UNNotificationServiceExtension
  // Este método existe para compatibilidad con la interfaz JS — en iOS no es necesario
  // porque el sistema ya muestra el contenido del push directamente
  NSString *chatId      = payload[@"chatId"] ?: @"";
  NSString *senderName  = payload[@"senderName"] ?: @"Mensaje";
  NSString *messageText = payload[@"messageText"] ?: @"";

  // Mostrar notificación local si la app está en primer plano
  UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
  content.title = senderName;
  content.body  = messageText;
  content.sound = [UNNotificationSound soundNamed:@"notification.wav"];
  content.userInfo = @{ @"chatId": chatId };

  UNTimeIntervalNotificationTrigger *trigger =
    [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:0.1 repeats:NO];

  NSString *identifier = [NSString stringWithFormat:@"egchat_msg_%@_%@",
                          chatId, @((long)[[NSDate date] timeIntervalSince1970])];

  UNNotificationRequest *request =
    [UNNotificationRequest requestWithIdentifier:identifier
                                         content:content
                                         trigger:trigger];

  [[UNUserNotificationCenter currentNotificationCenter]
    addNotificationRequest:request
     withCompletionHandler:^(NSError *error) {
      if (error) NSLog(@"[RichNotif] Error: %@", error);
  }];
}

RCT_EXPORT_METHOD(cancel:(NSString *)chatId) {
  [[UNUserNotificationCenter currentNotificationCenter]
    removePendingNotificationRequestsWithIdentifiers:@[chatId]];
  [[UNUserNotificationCenter currentNotificationCenter]
    removeDeliveredNotificationsWithIdentifiers:@[chatId]];
}

@end
