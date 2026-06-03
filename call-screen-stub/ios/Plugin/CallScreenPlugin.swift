import Foundation
import Capacitor

// Stub iOS plugin — EGCHAT uses native iOS UI for incoming calls
// This stub satisfies cap sync without any native functionality
@objc(CallScreenPlugin)
public class CallScreenPlugin: CAPPlugin {
    @objc func showIncomingCall(_ call: CAPPluginCall) {
        call.resolve(["success": true])
    }
    @objc func hideCallScreen(_ call: CAPPluginCall) {
        call.resolve(["success": true])
    }
    @objc func answerCall(_ call: CAPPluginCall) {
        call.resolve(["success": true])
    }
    @objc func rejectCall(_ call: CAPPluginCall) {
        call.resolve(["success": true])
    }
}
