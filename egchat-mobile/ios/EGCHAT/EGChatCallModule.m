#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/**
 * EGChatCallModule — Objective-C bridge
 * Expone el módulo Swift EGChatCallModule a React Native.
 */
@interface RCT_EXTERN_MODULE(EGChatCallModule, RCTEventEmitter)

/// Muestra la pantalla nativa de llamada entrante (CallKit)
RCT_EXTERN_METHOD(showIncomingCall:(NSString *)callerName
                  callerAvatar:(NSString *)callerAvatar
                  callId:(NSString *)callId
                  isVideo:(BOOL)isVideo)

/// Cierra la UI de llamada entrante
RCT_EXTERN_METHOD(dismissIncomingCall)

/// Notifica a CallKit que el usuario contestó desde la app
RCT_EXTERN_METHOD(answerCall:(NSString *)callId)

/// Notifica a CallKit que el usuario rechazó desde la app
RCT_EXTERN_METHOD(rejectCall:(NSString *)callId)

/// Notifica a CallKit que la llamada terminó
RCT_EXTERN_METHOD(endCall:(NSString *)callId)

@end
