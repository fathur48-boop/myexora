// ================================================
// src/lib/api/index.ts — Re-export all API clients
// Re-exporting modules from client files for clean imports.
// ================================================

export {
  authApi,
  customerApi,
  tokoApi,
  produkApi,
  pesananApi,
  analyticsApi,
  tokoInfoApi,
  ratingApi,
  adminApi,
  streamApi,
  liveApi,
  trafficApi,
  bundleApi,
  flashSaleApi,
  voucherApi,
  promoApi,
  reviewApi,
} from './adminClient'

export { biteshipApi } from './biteshipClient'
export { chatApi, showcaseChatApi, airaApi, copywriterApi, storefrontAiApi } from './groqClient'
export { paymentApi, credentialsApi } from './paymentClient'
