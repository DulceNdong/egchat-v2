// Bridge Objective-C → Swift para EGChatFaceFilter
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(EGChatFaceFilter, NSObject)

RCT_EXTERN_METHOD(detectFacesInImage:(NSString *)base64Image
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(releaseDetector)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
