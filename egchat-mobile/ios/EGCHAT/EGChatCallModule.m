// Bridge Objective-C → Swift para React Native
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EGChatCallModule, RCTEventEmitter)

RCT_EXTERN_METHOD(showIncomingCall:(NSString *)callerName
                  callerAvatar:(NSString *)callerAvatar
                  callId:(NSString *)callId
                  isVideo:(BOOL)isVideo)

RCT_EXTERN_METHOD(dismissIncomingCall)
RCT_EXTERN_METHOD(endCall:(NSString *)callId)
RCT_EXTERN_METHOD(answerCall:(NSString *)callId)
RCT_EXTERN_METHOD(rejectCall:(NSString *)callId)

// Eventos
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(nonnull NSNumber *)count)

@end
