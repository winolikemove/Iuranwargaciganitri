/**
 * CODE.GS REFERENCE - Google Apps Script untuk Aplikasi Manajemen Warga
 * 
 * Struktur ini sudah mencakup:
 * 1. Status pembayaran: PENDING, APPROVED, REJECTED
 * 2. Sheet keuangan terintegrasi
 * 3. Payment approval flow yang membuat transaksi income
 */

// ==================== KONFIGURASI SHEETS ====================
const SHEET_CONFIG = {
  USERS: 'Users',
  PAYMENTS: 'Payments',        // Sheet untuk pembayaran
  TRANSACTIONS: 'Keuangan',    // Sheet untuk keuangan (pemasukan/pengeluaran)
  SETTINGS: 'Settings',
  PENDING_USERS: 'PendingUsers',
};

// ==================== STRUKTUR KOLOM PAYMENTS ====================
/*
 * Sheet: Payments
 * Kolom:
 * A - id (string, unique)
 * B - userId (string)
 * C - userName (string)
 * D - blok (string: 'A' atau 'B')
 * E - nomorRumah (string)
 * F - periods (string, comma separated: "Januari 2024,Februari 2024")
 * G - amount (number)
 * H - buktiUrl (string, URL bukti transfer)
 * I - status (string: 'PENDING', 'APPROVED', 'REJECTED')
 * J - processedBy (string, userId admin yang approve/reject)
 * K - processedAt (datetime)
 * L - rejectReason (string)
 * M - createdAt (datetime)
 */

// ==================== STRUKTUR KOLOM KEUANGAN ====================
/*
 * Sheet: Keuangan
 * Kolom:
 * A - id (string, unique)
 * B - blok (string: 'A' atau 'B')
 * C - type (string: 'INCOME' atau 'EXPENSE')
 * D - category (string)
 * E - amount (number)
 * F - description (string)
 * G - date (date)
 * H - paymentId (string, reference ke Payments jika dari pembayaran)
 * I - createdBy (string, userId)
 * J - createdAt (datetime)
 */

// ==================== GET ACTIVE SPREADSHEET ====================
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

// ==================== PAYMENT STATUS CONSTANTS ====================
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const TRANSACTION_TYPE = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
};

// ==================== PAYMENT FUNCTIONS ====================

/**
 * Submit pembayaran baru - Status: PENDING
 */
function submitPayment(periods, buktiUrl) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }

    const settings = getSettings();
    const monthlyFee = settings.monthlyFee || 150000;
    const amount = periods.length * monthlyFee;

    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const id = 'PAY-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const now = new Date();

    // Row: id, userId, userName, blok, nomorRumah, periods, amount, buktiUrl, status, processedBy, processedAt, rejectReason, createdAt
    sheet.appendRow([
      id,
      user.id,
      user.nama,
      user.blok,
      user.nomorRumah,
      periods.join(','),
      amount,
      buktiUrl,
      PAYMENT_STATUS.PENDING,  // STATUS PENDING
      '',                      // processedBy
      '',                      // processedAt
      '',                      // rejectReason
      now
    ]);

    return { 
      ok: true, 
      data: { 
        message: 'Pembayaran berhasil dikirim, menunggu verifikasi', 
        id: id 
      } 
    };
  } catch (error) {
    console.error('submitPayment error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Get pembayaran user saat ini
 */
function getMyPayments() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }

    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { ok: true, data: [] };
    }

    const payments = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === user.id) { // userId match
        payments.push({
          id: row[0],
          userId: row[1],
          userName: row[2],
          blok: row[3],
          nomorRumah: row[4],
          periods: row[5] ? row[5].toString().split(',') : [],
          amount: parseFloat(row[6]) || 0,
          buktiUrl: row[7],
          status: row[8] || PAYMENT_STATUS.PENDING,
          processedBy: row[9],
          processedAt: row[10],
          rejectReason: row[11],
          createdAt: row[12]
        });
      }
    }

    return { ok: true, data: payments };
  } catch (error) {
    console.error('getMyPayments error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Get periode yang sudah dibayar (APPROVED only)
 */
function getPaidPeriods(userId) {
  try {
    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    const paidPeriods = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Hanya yang status APPROVED
      if (row[1] === userId && row[8] === PAYMENT_STATUS.APPROVED) {
        const periods = row[5] ? row[5].toString().split(',') : [];
        paidPeriods.push(...periods);
      }
    }

    return { ok: true, data: [...new Set(paidPeriods)] }; // Remove duplicates
  } catch (error) {
    console.error('getPaidPeriods error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Get pembayaran dengan status PENDING (untuk admin/bendahara)
 */
function getPendingPayments() {
  try {
    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    const payments = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[8] === PAYMENT_STATUS.PENDING) {
        payments.push({
          id: row[0],
          userId: row[1],
          userName: row[2],
          blok: row[3],
          nomorRumah: row[4],
          periods: row[5] ? row[5].toString().split(',') : [],
          amount: parseFloat(row[6]) || 0,
          buktiUrl: row[7],
          status: row[8],
          createdAt: row[12]
        });
      }
    }

    return { ok: true, data: payments };
  } catch (error) {
    console.error('getPendingPayments error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * APPROVE pembayaran - Status berubah ke APPROVED dan masuk ke KEUANGAN
 */
function approvePayment(paymentId) {
  try {
    const admin = getCurrentUser();
    if (!admin) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }

    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    let paymentRow = -1;
    let payment = null;
    
    // Cari pembayaran
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === paymentId) {
        paymentRow = i + 1; // 1-indexed
        payment = {
          id: data[i][0],
          userId: data[i][1],
          userName: data[i][2],
          blok: data[i][3],
          nomorRumah: data[i][4],
          periods: data[i][5] ? data[i][5].toString().split(',') : [],
          amount: parseFloat(data[i][6]) || 0,
          buktiUrl: data[i][7],
          status: data[i][8]
        };
        break;
      }
    }

    if (!payment) {
      return { ok: false, error: 'Pembayaran tidak ditemukan' };
    }

    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return { ok: false, error: 'Pembayaran sudah diproses' };
    }

    const now = new Date();

    // Update status di sheet Payments
    // Kolom: I (status), J (processedBy), K (processedAt)
    sheet.getRange(paymentRow, 9).setValue(PAYMENT_STATUS.APPROVED);
    sheet.getRange(paymentRow, 10).setValue(admin.id);
    sheet.getRange(paymentRow, 11).setValue(now);

    // ==================== BUAT TRANSAKSI INCOME DI SHEET KEUANGAN ====================
    createIncomeTransactionFromPayment(payment, admin.id);

    return { 
      ok: true, 
      data: { 
        message: 'Pembayaran berhasil disetujui dan dicatat sebagai pemasukan' 
      } 
    };
  } catch (error) {
    console.error('approvePayment error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Buat transaksi income dari pembayaran yang di-approve
 */
function createIncomeTransactionFromPayment(payment, adminId) {
  const keuanganSheet = getSheet(SHEET_CONFIG.TRANSACTIONS);
  const id = 'TRX-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const now = new Date();
  
  // Format periode untuk description
  const periodStr = payment.periods.join(', ');
  const description = `Iuran dari ${payment.userName} (Blok ${payment.blok}, No. ${payment.nomorRumah}) - Periode: ${periodStr}`;

  // Row: id, blok, type, category, amount, description, date, paymentId, createdBy, createdAt
  keuanganSheet.appendRow([
    id,
    payment.blok,                    // Blok warga yang bayar
    TRANSACTION_TYPE.INCOME,         // INCOME
    'Iuran Bulanan',                 // Category
    payment.amount,                  // Amount
    description,                     // Description
    now,                             // Date
    payment.id,                      // Payment ID reference
    adminId,                         // Created by (admin yang approve)
    now                              // Created at
  ]);
}

/**
 * REJECT pembayaran
 */
function rejectPayment(paymentId, reason) {
  try {
    const admin = getCurrentUser();
    if (!admin) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }

    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    let paymentRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === paymentId) {
        paymentRow = i + 1;
        break;
      }
    }

    if (paymentRow === -1) {
      return { ok: false, error: 'Pembayaran tidak ditemukan' };
    }

    const now = new Date();

    // Update status
    sheet.getRange(paymentRow, 9).setValue(PAYMENT_STATUS.REJECTED);
    sheet.getRange(paymentRow, 10).setValue(admin.id);
    sheet.getRange(paymentRow, 11).setValue(now);
    sheet.getRange(paymentRow, 12).setValue(reason || 'Ditolak oleh admin');

    return { ok: true, data: { message: 'Pembayaran ditolak' } };
  } catch (error) {
    console.error('rejectPayment error:', error);
    return { ok: false, error: error.message };
  }
}

// ==================== KEUANGAN FUNCTIONS ====================

/**
 * Get ringkasan keuangan
 */
function getFinanceSummary(year, month, blok) {
  try {
    const sheet = getSheet(SHEET_CONFIG.TRANSACTIONS);
    const data = sheet.getDataRange().getValues();
    
    const settings = getSettings();
    let saldoAwal = blok === 'A' ? (settings.saldoAwalA || 0) : (settings.saldoAwalB || 0);
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const transactions = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowBlok = row[1];
      const rowType = row[2];
      const rowAmount = parseFloat(row[4]) || 0;
      const rowDate = row[6];

      // Filter by blok if specified
      if (blok && rowBlok !== blok) continue;

      // Filter by year/month if specified
      if (year && rowDate) {
        const date = new Date(rowDate);
        if (date.getFullYear() !== year) continue;
        if (month !== undefined && date.getMonth() + 1 !== month) continue;
      }

      if (rowType === TRANSACTION_TYPE.INCOME) {
        totalPemasukan += rowAmount;
      } else if (rowType === TRANSACTION_TYPE.EXPENSE) {
        totalPengeluaran += rowAmount;
      }

      transactions.push({
        id: row[0],
        blok: row[1],
        type: row[2],
        category: row[3],
        amount: rowAmount,
        description: row[5],
        date: row[6],
        paymentId: row[7],
        createdBy: row[8],
        createdAt: row[9]
      });
    }

    const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;

    return {
      ok: true,
      data: {
        saldoAwal,
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir,
        transactions: transactions.reverse() // Latest first
      }
    };
  } catch (error) {
    console.error('getFinanceSummary error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Create transaksi manual (untuk pengeluaran atau pemasukan lain)
 */
function createTransaction(type, category, amount, description, date, blok) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }

    const sheet = getSheet(SHEET_CONFIG.TRANSACTIONS);
    const id = 'TRX-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const now = new Date();
    const transactionDate = date ? new Date(date) : now;
    const transactionBlok = blok || user.blok;

    // Row: id, blok, type, category, amount, description, date, paymentId, createdBy, createdAt
    sheet.appendRow([
      id,
      transactionBlok,
      type,                     // INCOME atau EXPENSE
      category,
      amount,
      description,
      transactionDate,
      '',                      // paymentId (kosong untuk manual)
      user.id,
      now
    ]);

    return { 
      ok: true, 
      data: { 
        message: 'Transaksi berhasil dibuat', 
        id: id 
      } 
    };
  } catch (error) {
    console.error('createTransaction error:', error);
    return { ok: false, error: error.message };
  }
}

// ==================== SETTINGS FUNCTIONS ====================

/**
 * Get settings
 */
function getSettings() {
  try {
    const sheet = getSheet(SHEET_CONFIG.SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      settings[key] = value;
    }

    // Parse bank info per blok
    if (settings.bankInfoA) {
      try {
        settings.bankInfoA = JSON.parse(settings.bankInfoA);
      } catch (e) {}
    }
    if (settings.bankInfoB) {
      try {
        settings.bankInfoB = JSON.parse(settings.bankInfoB);
      } catch (e) {}
    }

    // Parse categories per blok
    if (settings.categoriesA) {
      try {
        settings.categoriesA = JSON.parse(settings.categoriesA);
      } catch (e) {}
    }
    if (settings.categoriesB) {
      try {
        settings.categoriesB = JSON.parse(settings.categoriesB);
      } catch (e) {}
    }

    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return {};
  }
}

/**
 * Update settings
 */
function updateSettings(newSettings) {
  try {
    const sheet = getSheet(SHEET_CONFIG.SETTINGS);
    
    // Clear existing and write new
    sheet.clear();
    sheet.appendRow(['key', 'value']);
    
    for (const [key, value] of Object.entries(newSettings)) {
      let serializedValue = value;
      if (typeof value === 'object') {
        serializedValue = JSON.stringify(value);
      }
      sheet.appendRow([key, serializedValue]);
    }

    return { ok: true, data: { message: 'Settings berhasil disimpan' } };
  } catch (error) {
    console.error('updateSettings error:', error);
    return { ok: false, error: error.message };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get current user dari token
 */
function getCurrentUser() {
  // Implementasi sesuai dengan sistem auth Anda
  // Contoh: decode token dari PropertiesService atau cache
  const token = getTokenFromRequest();
  if (!token) return null;
  
  // Get user dari Users sheet berdasarkan token/session
  // ... implementasi sesuai kebutuhan
  return null;
}

/**
 * Parse token dari request
 */
function getTokenFromRequest() {
  // Implementasi sesuai dengan cara Anda mengirim token
  return null;
}

// ==================== DOPOST HANDLER ====================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const token = payload.token;
    const data = payload.payload || {};

    let result;

    switch (action) {
      // Payments
      case 'payment.submit':
        result = submitPayment(data.periods, data.buktiUrl);
        break;
      case 'payment.myPayments':
        result = getMyPayments();
        break;
      case 'payment.pending':
        result = getPendingPayments();
        break;
      case 'payment.approve':
        result = approvePayment(data.paymentId);
        break;
      case 'payment.reject':
        result = rejectPayment(data.paymentId, data.reason);
        break;
      case 'payment.paidPeriods':
        result = getPaidPeriods(data.userId);
        break;
      case 'payment.all':
        result = getAllPayments(data.filters);
        break;

      // Finance
      case 'finance.summary':
        result = getFinanceSummary(data.year, data.month, data.blok);
        break;
      case 'finance.create':
        result = createTransaction(data.type, data.category, data.amount, data.description, data.date, data.blok);
        break;

      // Settings
      case 'settings.all':
        result = { ok: true, data: getSettings() };
        break;
      case 'settings.update':
        result = updateSettings(data);
        break;

      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      ok: false, 
      error: error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all payments (admin)
 */
function getAllPayments(filters) {
  try {
    const sheet = getSheet(SHEET_CONFIG.PAYMENTS);
    const data = sheet.getDataRange().getValues();
    
    const payments = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[8];
      const blok = row[3];

      // Apply filters
      if (filters) {
        if (filters.status && status !== filters.status) continue;
        if (filters.blok && blok !== filters.blok) continue;
      }

      payments.push({
        id: row[0],
        userId: row[1],
        userName: row[2],
        blok: row[3],
        nomorRumah: row[4],
        periods: row[5] ? row[5].toString().split(',') : [],
        amount: parseFloat(row[6]) || 0,
        buktiUrl: row[7],
        status: status || PAYMENT_STATUS.PENDING,
        processedBy: row[9],
        processedAt: row[10],
        rejectReason: row[11],
        createdAt: row[12]
      });
    }

    return { ok: true, data: payments.reverse() };
  } catch (error) {
    console.error('getAllPayments error:', error);
    return { ok: false, error: error.message };
  }
}

// ==================== SETUP SHEETS (Run once) ====================

function setupSheets() {
  const ss = getSpreadsheet();
  
  // Create Payments sheet if not exists
  let paymentsSheet = ss.getSheetByName(SHEET_CONFIG.PAYMENTS);
  if (!paymentsSheet) {
    paymentsSheet = ss.insertSheet(SHEET_CONFIG.PAYMENTS);
    paymentsSheet.appendRow([
      'id', 'userId', 'userName', 'blok', 'nomorRumah', 'periods', 
      'amount', 'buktiUrl', 'status', 'processedBy', 'processedAt', 
      'rejectReason', 'createdAt'
    ]);
    paymentsSheet.getRange(1, 1, 1, 13).setFontWeight('bold');
  }

  // Create Keuangan sheet if not exists
  let keuanganSheet = ss.getSheetByName(SHEET_CONFIG.TRANSACTIONS);
  if (!keuanganSheet) {
    keuanganSheet = ss.insertSheet(SHEET_CONFIG.TRANSACTIONS);
    keuanganSheet.appendRow([
      'id', 'blok', 'type', 'category', 'amount', 'description', 
      'date', 'paymentId', 'createdBy', 'createdAt'
    ]);
    keuanganSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  Logger.log('Sheets setup complete!');
}
