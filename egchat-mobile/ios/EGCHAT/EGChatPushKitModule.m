#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/**
 * EGChatPushKitModule — Objective-C bridge
 * Expone el módulo Swift EGChatPushKitModule a React Native.
 */
@interface RCT_EXTERN_MODULE(EGChatPushKitModule, RCTEventEmitter)

RCT_EXTERN_METHOD(registerVoIP)
RCT_EXTERN_METHOD(setAuthToken:(NSString *)token)
RCT_EXTERN_METHOD(getCurrentVoIPToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
