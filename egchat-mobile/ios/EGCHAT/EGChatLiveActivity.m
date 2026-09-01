// Bridge Objective-C → Swift para EGChatLiveActivityModule
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(EGChatLiveActivityModule, NSObject)

RCT_EXTERN_METHOD(startCallActivity:(NSString *)callId
                  callerName:(NSString *)callerName
                  isVideo:(BOOL)isVideo)

RCT_EXTERN_METHOD(updateCallActivity:(nonnull NSNumber *)seconds)

RCT_EXTERN_METHOD(endCallActivity)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
