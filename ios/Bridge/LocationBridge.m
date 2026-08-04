#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LocationBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(saveUserDetailsAndStartLocationUpdates:(NSDictionary *)data)
RCT_EXTERN_METHOD(clearUserDetails)
RCT_EXTERN_METHOD(syncLocationData)
RCT_EXTERN_METHOD(endUserSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCurrentLocation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(checkForLogOut:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(uploadOfflineLocationData:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(shareLogFile:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
 
