/** 轻量触觉反馈，仅在浏览器支持且用户开启时生效 */
export function haptic(enabled: boolean, duration = 12) {
  if (!enabled || typeof navigator === "undefined") return;
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(duration);
  } catch (error) {
    console.error("触觉反馈失败", error);
  }
}
