/**
 * EGChatAudioRecorder.m
 * Puente Objective-C — React Native ↔ AVAudioRecorder Swift
 */

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(EGChatAudioRecorder, EGChatAudioRecorderBridge, NSObject)

RCT_EXTERN_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelRecording)

RCT_EXTERN_METHOD(getAmplitude:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
