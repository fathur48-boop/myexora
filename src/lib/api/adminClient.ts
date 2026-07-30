// ================================================
// src/lib/api/adminClient.ts
// ================================================
import { safeFetchJson } from '../utils'

async function call(action: string, token: string | null, ...args: any[]) {
  const res = await fetch('/api/toko', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: token ?? null, args }),
  })
  const data = await safeFetchJson(res)
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan')
  }
  return data
}

// ================================================
// AUTH
// ================================================
export const authApi = {
  loginWithGoogle: (googleUser: any) => call('authApi.loginWithGoogle', null, googleUser),
  getMe: (token: string) => call('authApi.getMe', token),
  logout: (token: string) => call('authApi.logout', token),
}

// ================================================
// CUSTOMER
// ================================================
export const customerApi = {
  loginWithGoogle: (googleUser: any, tokoId: string) => call('customerApi.loginWithGoogle', null, googleUser, tokoId),
  getMe: (token: string) => call('customerApi.getMe', token),
  logout: (token: string) => call('customerApi.logout', token),
  getMyOrders: (token: string) => call('customerApi.getMyOrders', token),
}

// ================================================
// TOKO
// ================================================
export const tokoApi = {
  create: (token: string, data: any) => call('tokoApi.create', token, data),
  update: (token: string, tokoId: string, data: any) => call('tokoApi.update', token, tokoId, data),
  delete: (token: string, tokoId: string) => call('tokoApi.delete', token, tokoId),
  getMine: (token: string) => call('tokoApi.getMine', token),
  getBySlug: (slug: string) => call('tokoApi.getBySlug', null, slug),
  getByDomain: (domain: string) => call('tokoApi.getByDomain', null, domain),
  checkSlug: (slug: string) => call('tokoApi.checkSlug', null, slug),
  requestUpgrade: (token: string) => call('tokoApi.requestUpgrade', token),
  search: (query: string) => call('tokoApi.search', null, query),
  confirmUpgrade: (token: string, userId: string, targetPlan = 'pro') => call('tokoApi.confirmUpgrade', token, userId, targetPlan),
}

// ================================================
// PRODUK
// ================================================
export const produkApi = {
  create: (token: string, data: any) => call('produkApi.create', token, data),
  update: (token: string, produkId: string, data: any) => call('produkApi.update', token, produkId, data),
  delete: (token: string, produkId: string) => call('produkApi.delete', token, produkId),
  getMine: (token: string) => call('produkApi.getMine', token),
  getByToko: (tokoId: string, params?: any) => call('produkApi.getByToko', null, tokoId, params ?? {}),
  getById: (produkId: string) => call('produkApi.getById', null, produkId),
}

// ================================================
// PESANAN
// ================================================
export const pesananApi = {
  create: (data: any) => call('pesananApi.create', null, data),
  getMine: (token: string, status?: string) => call('pesananApi.getMine', token, status),
  updateStatus: (token: string, pesananId: string, status: string, kurir?: string, resi?: string) => call('pesananApi.updateStatus', token, pesananId, status, kurir, resi),
  getById: (pesananId: string, buyerWa?: string) => call('pesananApi.getById', null, pesananId, buyerWa),
  getByOrderId: (orderId: string, buyerWa?: string) => call('pesananApi.getByOrderId', null, orderId, buyerWa),
  getByWa: (buyerWa: string) => call('pesananApi.getByWa', null, buyerWa),
  getSlugByResi: (resi: string) => call('pesananApi.getSlugByResi', null, resi),
}

// ================================================
// ANALYTICS
// ================================================
export const analyticsApi = {
  getDashboard: (token: string) => call('analyticsApi.getDashboard', token),
}

// ================================================
// TOKO INFO
// ================================================
export const tokoInfoApi = {
  get: (token: string) => call('tokoInfoApi.get', token),
  update: (token: string, data: any) => call('tokoInfoApi.update', token, data),
}

// ================================================
// RATING
// ================================================
export const ratingApi = {
  add: (data: any) => call('ratingApi.add', null, data),
  get: (params?: any) => call('ratingApi.get', null, params),
}

// ================================================
// ADMIN — DENGAN CRUD BLOG/GUIDES/HELP
// ================================================
export const adminApi = {
  getUsers: (token?: string) => call('adminApi.getUsers', token || null),
  getStats: (token?: string) => call('adminApi.getStats', token || null),
  getSellers: (token?: string) => call('adminApi.getSellers', token || null),
  getSystemLogs: (token?: string) => call('adminApi.getSystemLogs', token || null),
  toggleProStatus: (sellerId: string, token?: string) => call('adminApi.toggleProStatus', token || null, sellerId),
  toggleStoreStatus: (sellerId: string, token?: string) => call('adminApi.toggleStoreStatus', token || null, sellerId),
  grantPlan: (token: string, targetUserId: string, planName: string, months: number) => call('adminApi.grantPlan', token, targetUserId, planName, months),
  grantPro: (token: string, targetUserId: string, months: number) => call('adminApi.grantPro', token, targetUserId, months),
  revokePro: (token: string, targetUserId: string) => call('adminApi.revokePro', token, targetUserId),
  deleteUser: (token: string, targetUserId: string) => call('adminApi.deleteUser', token, targetUserId),

  // Blog CRUD
  createBlogPost: (token: string, data: any) => call('adminApi.createBlogPost', token, data),
  updateBlogPost: (token: string, postId: string, data: any) => call('adminApi.updateBlogPost', token, postId, data),
  deleteBlogPost: (token: string, postId: string) => call('adminApi.deleteBlogPost', token, postId),

  // Guides CRUD
  createGuide: (token: string, data: any) => call('adminApi.createGuide', token, data),
  updateGuide: (token: string, guideId: string, data: any) => call('adminApi.updateGuide', token, guideId, data),
  deleteGuide: (token: string, guideId: string) => call('adminApi.deleteGuide', token, guideId),

  // Help Articles CRUD
  createHelpArticle: (token: string, data: any) => call('adminApi.createHelpArticle', token, data),
  updateHelpArticle: (token: string, articleId: string, data: any) => call('adminApi.updateHelpArticle', token, articleId, data),
  deleteHelpArticle: (token: string, articleId: string) => call('adminApi.deleteHelpArticle', token, articleId),
}

// ================================================
// STREAM
// ================================================
export const streamApi = {
  getFeed: (token: string, params?: any) => call('streamApi.getFeed', token, params),
  getPostDetail: (token: string, postId: string) => call('streamApi.getPostDetail', token, postId),
  createPost: (token: string, data: any) => call('streamApi.createPost', token, data),
  deletePost: (token: string, postId: string) => call('streamApi.deletePost', token, postId),
  addReply: (token: string, data: any) => call('streamApi.addReply', token, data),
  toggleLike: (token: string, data: any) => call('streamApi.toggleLike', token, data),
  toggleRepost: (token: string, data: any) => call('streamApi.toggleRepost', token, data),
  toggleBookmark: (token: string, data: any) => call('streamApi.toggleBookmark', token, data),
  getDmThreads: (token: string) => call('streamApi.getDmThreads', token),
  getDmMessages: (token: string, threadId: string) => call('streamApi.getDmMessages', token, threadId),
  openDmThread: (token: string, data: any) => call('streamApi.openDmThread', token, data),
  sendDmMessage: (token: string, data: any) => call('streamApi.sendDmMessage', token, data),
  getNotifications: (token: string) => call('streamApi.getNotifications', token),
  markNotificationsRead: (token: string) => call('streamApi.markNotificationsRead', token),
  uploadImage: (token: string, data: any) => call('streamApi.uploadImage', token, data),
  getPublicShowcase: (params?: any) => call('streamApi.getPublicShowcase', null, params),
  getShowcaseStats: () => call('streamApi.getShowcaseStats', null),
}

// ================================================
// LIVE
// ================================================
export const liveApi = {
  goLive: (token: string, data: any) => call('liveApi.goLive', token, data),
  joinLive: (token: string, data: any) => call('liveApi.joinLive', token, data),
  endLive: (token: string, data: any) => call('liveApi.endLive', token, data),
  getActiveSessions: (token: string) => call('liveApi.getActiveSessions', token),
  sendReaction: (token: string, data: any) => call('liveApi.sendReaction', token, data),
  leaveRoom: (token: string, data: any) => call('liveApi.leaveRoom', token, data),
}

// ================================================
// TRAFFIC
// ================================================
export const trafficApi = {
  trackVisit: (tokoId: string) => call('trafficApi.trackVisit', null, tokoId),
  getStats: (token: string) => call('trafficApi.getStats', token),
}

export const bundleApi = {
  create: (token: string, data: any) => call('bundleApi.create', token, data),
  update: (token: string, bundleId: string, data: any) => call('bundleApi.update', token, bundleId, data),
  delete: (token: string, bundleId: string) => call('bundleApi.delete', token, bundleId),
  getMine: (token: string) => call('bundleApi.getMine', token),
  getByToko: (tokoId: string) => call('bundleApi.getByToko', null, tokoId),
}

export const flashSaleApi = {
  set: (token: string, produkId: string, data: any) => call('flashSaleApi.set', token, produkId, data),
  clear: (token: string, produkId: string) => call('flashSaleApi.clear', token, produkId),
  getActive: (tokoId: string) => call('flashSaleApi.getActive', null, tokoId),
}

export const voucherApi = {
  create: (token: string, data: any) => call('voucherApi.create', token, data),
  getMine: (token: string) => call('voucherApi.getMine', token),
  delete: (token: string, voucherId: string) => call('voucherApi.delete', token, voucherId),
  validate: (tokoId: string, kode: string, totalBelanja: number) => call('voucherApi.validate', null, tokoId, kode, totalBelanja),
  redeem: (voucherId: string) => call('voucherApi.redeem', null, voucherId),
}

export const promoApi = {
  getMine: (token: string) => voucherApi.getMine(token),
  create: (token: string, data: any) => voucherApi.create(token, data),
  delete: (token: string, id: string) => voucherApi.delete(token, id),
  validateCode: (kode: string, totalBelanja: number, tokoId = '') => voucherApi.validate(tokoId, kode, totalBelanja),
}

export const reviewApi = {
  getBySlug: (slug: string) => ratingApi.get({ slug }),
  create: (slug: string, data: any) => ratingApi.add({ slug, ...data }),
}
