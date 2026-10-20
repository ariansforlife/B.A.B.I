# Appium Android/iOS verification checklist

The B.A.B.I Appium adapter executes a local Node `.spec.js` test. This is not a full Appium driver installation. Set up Appium and the corresponding driver on the test laptop.

## Prerequisites
- Node.js, Appium server and WebdriverIO client installed in the local automation workspace.
- Android: Android SDK, adb, an authorized device/emulator, Appium UiAutomator2 driver.
- iOS: macOS, Xcode, an available simulator/device, Appium XCUITest driver and required signing for real devices.
- Set `BABI_DEVICE_ID` through the dashboard device picker. Scripts must use that value for the selected device and connect to the locally running Appium server.
- The test can write screenshots and attachments to `process.env.BABI_ARTIFACT_DIR`; the runner records artifact filenames and sizes.

## Manual acceptance on the laptop
1. Start Appium and B.A.B.I local bridge, open the dashboard and connect.
2. Confirm the Android device or iOS simulator is available and select it.
3. Execute a minimal Appium test using the appropriate driver, verify successful session creation and teardown.
4. Execute two tests targeting the same device; confirm the second waits for the first.
5. Cancel a running test; verify the process exits and the device becomes available.
6. Produce a screenshot in the artifact directory; verify the report and download endpoint.
7. Restart the bridge and verify saved reports are still accessible.

**Not yet verified:** real-device execution, screenshot capture, cancellation and CI on a device host. CI without attached devices cannot prove this checklist.
