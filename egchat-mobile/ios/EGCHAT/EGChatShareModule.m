#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EGChatShareModule, RCTEventEmitter)

RCT_EXTERN_METHOD(getSharedContent:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearSharedContent)

RCT_EXTERN_METHOD(saveRecentChats:(NSString *)chatsJson)

RCT_EXTERN_METHOD(saveAuthToken:(NSString *)token)

@end
