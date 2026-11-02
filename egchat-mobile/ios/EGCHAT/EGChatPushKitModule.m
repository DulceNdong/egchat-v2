#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/**
 * EGChatPushKitModule — Objective-C bridge
 * Expone el módulo Swift EGChatPushKitModule a React Native.
 */
@interface RCT_EXTERN_MODULE(EGChatPushKitModule, RCTEventEmitter)

/// Registra el dispositivo para recibir notificaciones VoIP push
RCT_EXTERN_METHOD(registerVoIP)

/// Lee el token VoIP ya generado por iOS (el JS puede llegar después del push)
RCT_EXTERN_METHOD(getCurrentVoIPToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
