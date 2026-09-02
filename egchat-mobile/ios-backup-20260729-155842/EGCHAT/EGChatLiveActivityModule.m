/**
 * EGChatLiveActivityModule.m
 * Puente Objective-C — React Native ↔ ActivityKit Swift
 */

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(EGChatLiveActivityModule, EGChatLiveActivityBridge, NSObject)

RCT_EXTERN_METHOD(startCallActivity:(NSString *)callId
                  callerName:(NSString *)callerName
                  isVideo:(BOOL)isVideo)

RCT_EXTERN_METHOD(updateCallActivity:(double)seconds)

RCT_EXTERN_METHOD(endCallActivity)

@end
