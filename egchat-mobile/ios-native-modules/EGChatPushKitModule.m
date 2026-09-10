#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/**
 * EGChatPushKitModule — Objective-C bridge
 * Expone el módulo Swift EGChatPushKitModule a React Native.
 */
@interface RCT_EXTERN_MODULE(EGChatPushKitModule, RCTEventEmitter)

/// Registra el dispositivo para recibir notificaciones VoIP push
RCT_EXTERN_METHOD(registerVoIP)

@end
