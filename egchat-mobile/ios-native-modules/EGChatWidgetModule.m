#import <React/RCTBridgeModule.h>

/**
 * EGChatWidgetModule — Objective-C bridge
 * Expone el módulo Swift EGChatWidgetModule a React Native.
 */
@interface RCT_EXTERN_MODULE(EGChatWidgetModule, NSObject)

/// Actualiza el widget con los últimos chats
/// - chatsJSON: Array JSON string de WidgetChat[]
/// - unreadTotal: total de no leídos para el badge
RCT_EXTERN_METHOD(
  updateWidget:(NSString *)chatsJSON
  unreadTotal:(NSInteger)unreadTotal
)

/// Limpia el widget al cerrar sesión
RCT_EXTERN_METHOD(clearWidget)

@end
