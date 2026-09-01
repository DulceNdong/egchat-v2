// Bridge Objective-C → Swift para EGChatAudioRecorder
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(EGChatAudioRecorder, NSObject)

RCT_EXTERN_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelRecording)

RCT_EXTERN_METHOD(getAmplitude:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
