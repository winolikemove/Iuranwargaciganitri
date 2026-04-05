// ==================== PERBAIKAN YANG DISARANKAN ====================

/**
 * 1. UPDATE SCHEMA transactions - tambahkan kolom paymentId
 * 
 * Sebelum:
 * transactions: ['id', 'blok', 'type', 'category', 'amount', 'description', 'date', 'createdBy', 'createdAt'],
 * 
 * Sesudah:
 */
const SCHEMAS = {
  // ... schemas lainnya
  transactions: ['id', 'blok', 'type', 'category', 'amount', 'description', 'date', 'paymentId', 'createdBy', 'createdAt'],
  // ... schemas lainnya
};

/**
 * 2. UPDATE paymentApprove - tambahkan paymentId di transaksi
 */
function paymentApprove(user, { paymentId }) {
  const permCheck = requirePermission(user, 'canApprovePayment');
  if (permCheck) return permCheck;
  
  const payment = dbFindOne('payments', { id: paymentId });
  if (!payment) {
    return { ok: false, error: 'Pembayaran tidak ditemukan' };
  }
  
  if (payment.status !== 'PENDING') {
    return { ok: false, error: 'Pembayaran sudah diproses' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && payment.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat approve pembayaran blok lain' };
  }
  
  dbUpdate('payments', paymentId, {
    status: 'APPROVED',
    processedBy: user.nama,
    processedAt: new Date().toISOString(),
  });
  
  // Create income transaction dengan paymentId
  const periods = JSON.parse(payment.periods || '[]');
  dbInsert('transactions', {
    blok: payment.blok,
    type: 'INCOME',
    category: 'Iuran Bulanan',
    amount: payment.amount,
    description: `Iuran ${payment.userName} (Blok ${payment.blok}, No. ${payment.nomorRumah}) - ${periods.join(', ')}`,
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    paymentId: paymentId,  // ← TAMBAHKAN INI untuk tracking
    createdBy: 'System',
  });
  
  // Hapus cache agar public landing page menghitung ulang
  CacheService.getScriptCache().remove('publicFinanceSummary');
  
  return { ok: true, data: { message: 'Pembayaran berhasil disetujui dan dicatat sebagai pemasukan' } };
}

/**
 * 3. TAMBAHAN: Clear cache saat payment approve
 * 
 * Tambahkan baris ini di akhir function paymentApprove:
 */
CacheService.getScriptCache().remove('publicFinanceSummary');

/**
 * 4. UPDATE: Tambahkan kategori berdasarkan blok di settings
 * 
 * Di sheet Settings, tambahkan key-value:
 * - categoriesA: {"income": ["Iuran Bulanan", "Dana Sosial", "Sumbangan"], "expense": ["Kebersihan", "Keamanan", "Perbaikan"]}
 * - categoriesB: {"income": ["Iuran Bulanan", "Dana Sosial", "Sumbangan"], "expense": ["Kebersihan", "Keamanan", "Perbaikan"]}
 * - bankInfoA: {"bankName": "BCA", "bankAccount": "1234567890", "bankHolder": "RT Pradha Blok A"}
 * - bankInfoB: {"bankName": "Mandiri", "bankAccount": "0987654321", "bankHolder": "RT Pradha Blok B"}
 * - tarifIuran: 150000 (atau sesuai tarif iuran Anda)
 */

/**
 * 5. UPDATE: Function getPublicSettings untuk parse JSON
 */
function getPublicSettings() {
  const settings = dbGetAll('settings');
  const result = {};
  
  for (const s of settings) {
    let value = s.value;
    
    // Try to parse JSON for complex values
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if parse fails
      }
    }
    
    // Convert boolean strings
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    
    // Convert number strings
    if (!isNaN(Number(value)) && value !== '' && !value.startsWith('0')) {
      const num = Number(value);
      if (Number.isInteger(num)) {
        value = num;
      }
    }
    
    result[s.key] = value;
  }
  
  return result;
}
