// ==================== CONFIGURATION ====================
const CONFIG = {
  SPREADSHEETID: 'YOURSPREADSHEETID',
  DRIVEFOLDERID: 'YOURDRIVEFOLDERID',
  JWTSECRET: 'Pr4dh4_c1g4n1tr1_S3cr3t_2026_xYz',
  TOKENEXPIRYDAYS: 7,
};

// ==================== SHEET SCHEMAS (UPDATED v3) ====================
// Updated: Added 'jabatan' to users schema for organizational structure
const SCHEMAS = {
  users: ['id', 'nama', 'email', 'passwordHash', 'nik', 'telepon', 'blok', 'nomorRumah', 'role', 'status', 'photoUrl', 'jabatan', 'createdAt', 'updatedAt'],
  // UPDATED: Added 'paymentId' column to link transaction to approved payment
  transactions: ['id', 'blok', 'type', 'category', 'amount', 'description', 'date', 'paymentId', 'createdBy', 'createdAt'],
  payments: ['id', 'userId', 'userName', 'blok', 'nomorRumah', 'periods', 'amount', 'buktiUrl', 'status', 'processedBy', 'processedAt', 'rejectReason', 'createdAt'],
  agenda: ['id', 'title', 'description', 'location', 'startDate', 'endDate', 'startTime', 'endTime', 'status', 'targetBlok', 'createdBy', 'createdAt', 'updatedAt'],
  information: ['id', 'title', 'content', 'category', 'isPinned', 'targetBlok', 'publishedAt', 'expiredAt', 'createdBy', 'createdAt'],
  gallery: ['id', 'agendaId', 'title', 'description', 'imageUrl', 'thumbnailUrl', 'takenAt', 'uploadedBy', 'createdAt'],
  reviews: ['id', 'userId', 'userName', 'userPhotoUrl', 'rating', 'comment', 'status', 'createdAt'],
  settings: ['key', 'value'],
  permissions: ['role', 'permissions'],
  saldoawal: ['id', 'blok', 'year', 'amount', 'createdAt'],
  // NEW: Password reset tokens
  passwordResetTokens: ['id', 'userId', 'token', 'expiresAt', 'usedAt', 'createdAt'],
  // NEW: System logs for debugging
  logs: ['id', 'level', 'action', 'message', 'payload', 'error', 'userId', 'ipAddress', 'createdAt'],
};

// ==================== STRUKTUR ORGANISASI (NEW v3) ====================
// Jabatan per Blok (A dan B berbeda pengurus)
const JABATAN_PER_BLOK = {
  KETUA_RT: { label: 'Ketua RT', order: 1, scope: 'BLOK' },
  WAKIL_KETUA: { label: 'Wakil Ketua RT', order: 2, scope: 'BLOK' },
  SEKRETARIS: { label: 'Sekretaris', order: 3, scope: 'BLOK' },
  BENDAHARA: { label: 'Bendahara', order: 4, scope: 'BLOK' },
};

// Jabatan Bersama (untuk kedua blok - Keamanan, Kebersihan, DKM Masjid Al Birr)
const JABATAN_BERSAMA = {
  SIE_KEAMANAN: { label: 'Sie. Keamanan', order: 10, scope: 'SHARED' },
  SIE_KEBERSIHAN: { label: 'Sie. Kebersihan', order: 11, scope: 'SHARED' },
  DKM_MASJID: { label: 'DKM Masjid Al Birr', order: 12, scope: 'SHARED' },
};

// Gabungan semua jabatan
const ALL_JABATAN = { ...JABATAN_PER_BLOK, ...JABATAN_BERSAMA };

// Daftar jabatan untuk validasi
const VALID_JABATAN = Object.keys(ALL_JABATAN);

// ==================== MAIN ENTRY POINTS ====================
function doPost(e) {
  let action = 'unknown';
  let userId = null;
  
  try {
    const req = JSON.parse(e.postData.contents);
    
    // Struktur baru: { action, data, auth: { token } }
    const { action: act, data = {}, auth = {} } = req;
    action = act || 'unknown';
    const token = auth.token || null;
    
    // Public actions (no auth required)
    const publicActions = [
      'auth.login', 
      'auth.register', 
      'auth.forgotpassword',
      'auth.resetPassword',
      'settings.public',
      'finance.publicSummary',
      'agenda.publicList',
      'info.publicList',
      'pengurus.publicList',
      'pengurus.strukturOrganisasi',
      'review.publicList',
      'gallery.publicList'
    ];
    
    let user = null;
    if (!publicActions.includes(action)) {
      user = validateToken(token);
      if (!user) {
        logWarn(action, 'Token invalid atau expired', { hasToken: !!token }, userId);
        return respond({ ok: false, error: 'Token invalid atau expired' });
      }
      userId = user.id;
    }
    
    // Check feature toggles for certain actions
    const featureCheck = checkFeatureEnabled(action);
    if (!featureCheck.ok) {
      logWarn(action, 'Fitur dinonaktifkan', null, userId);
      return respond(featureCheck);
    }
    
    const result = routeAction(action, data, user);
    
    // Log important actions
    if (action.startsWith('auth.') || action.startsWith('finance.') || action.startsWith('payment.')) {
      logInfo(action, `Request completed: ${result.ok ? 'success' : 'failed'}`, { ok: result.ok, error: result.error }, userId);
    }
    
    return respond(result);
    
  } catch (error) {
    logError(action, 'Unhandled error in doPost', null, error.message, userId);
    console.error('doPost Error:', error);
    return respond({ ok: false, error: 'Terjadi kesalahan server' });
  }
}

function doGet() {
  return respond({ ok: true, data: { name: 'Pradha-Ciganitri API', version: '6.0.0' } });
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== LOGGING SYSTEM ====================
/**
 * Log errors and important events to Logs sheet for debugging
 * Since Vercel cannot see console.log() in GAS, this provides a way to trace issues
 */
function logEvent(level, action, message, payload, error, userId) {
  try {
    const sheet = getSheet('logs');
    const id = Utilities.getUuid();
    const now = new Date();
    
    // Truncate payload if too large (max 5000 chars)
    let payloadStr = payload ? JSON.stringify(payload) : '';
    if (payloadStr.length > 5000) {
      payloadStr = payloadStr.substring(0, 5000) + '... [truncated]';
    }
    
    // Truncate error message if too large
    let errorStr = error ? String(error) : '';
    if (errorStr.length > 2000) {
      errorStr = errorStr.substring(0, 2000) + '... [truncated]';
    }
    
    sheet.appendRow([
      id,
      level,           // INFO, WARN, ERROR
      action,          // e.g., 'auth.login', 'finance.create'
      message,         // Human readable message
      payloadStr,      // Request payload (truncated)
      errorStr,        // Error details if any
      userId || '',    // User ID if authenticated
      '',              // IP Address (not available in GAS Web App)
      now.toISOString()
    ]);
    
    // Also log to console for StackDriver
    if (level === 'ERROR') {
      console.error(`[${action}] ${message}`, error || '');
    } else if (level === 'WARN') {
      console.warn(`[${action}] ${message}`);
    } else {
      console.log(`[${action}] ${message}`);
    }
  } catch (logError) {
    // If logging fails, at least try to console log
    console.error('Failed to write to log sheet:', logError);
  }
}

// Convenience functions
function logInfo(action, message, payload, userId) {
  logEvent('INFO', action, message, payload, null, userId);
}

function logWarn(action, message, payload, userId) {
  logEvent('WARN', action, message, payload, null, userId);
}

function logError(action, message, payload, error, userId) {
  logEvent('ERROR', action, message, payload, error, userId);
}

// ==================== FEATURE TOGGLE CHECK (UPDATED) ====================
function checkFeatureEnabled(action) {
  const featureMap = {
    'auth.register': 'enableRegistration',
    'payment.submit': 'enablePaymentSubmission',
    'agenda.': 'enableAgenda',
    'gallery.': 'enableGallery',
    'info.': 'enableInformation',
    'finance.publicSummary': 'enablePublicFinance',
    'review.': 'enableReviews',
  };
  
  for (const [prefix, setting] of Object.entries(featureMap)) {
    if (action.startsWith(prefix) || action === prefix) {
      const settings = getPublicSettings();
      if (settings[setting] === false) {
        return { ok: false, error: 'Fitur ini sedang dinonaktifkan' };
      }
    }
  }
  
  return { ok: true };
}

// ==================== ACTION ROUTER (UPDATED) ====================
function routeAction(action, payload, user) {
  const routes = {
    // Public (Landing Page)
    'finance.publicSummary': () => financePublicSummary(),
    'agenda.publicList': () => agendaPublicList(payload),
    'info.publicList': () => infoPublicList(payload),
    'pengurus.publicList': () => pengurusPublicList(),
    'pengurus.strukturOrganisasi': () => pengurusStrukturOrganisasi(),
    'review.publicList': () => reviewPublicList(payload),
    'gallery.publicList': () => galleryPublicList(payload),
    
    // Auth
    'auth.login': () => authLogin(payload),
    'auth.register': () => authRegister(payload),
    'auth.forgotpassword': () => authForgotPassword(payload),
    'auth.resetPassword': () => authResetPassword(payload),
    'auth.me': () => ({ ok: true, data: sanitizeUser(user) }),
    'auth.changePassword': () => authChangePassword(user, payload),
    
    // User Management
    'user.list': () => userList(user, payload),
    'user.detail': () => userDetail(user, payload),
    'user.pending': () => userPending(user),
    'user.approve': () => userApprove(user, payload),
    'user.reject': () => userReject(user, payload),
    'user.updateRole': () => userUpdateRole(user, payload),
    'user.block': () => userBlock(user, payload),
    'user.unblock': () => userUnblock(user, payload),
    'user.update': () => userUpdate(user, payload),
    'user.updateJabatan': () => userUpdateJabatan(user, payload),
    
    // Finance
    'finance.summary': () => financeSummary(user, payload),
    'finance.transactions': () => financeTransactions(user, payload),
    'finance.create': () => financeCreate(user, payload),
    'finance.update': () => financeUpdate(user, payload),
    'finance.delete': () => financeDelete(user, payload),
    'finance.setSaldoAwal': () => financeSetSaldoAwal(user, payload),
    
    // Payment
    'payment.submit': () => paymentSubmit(user, payload),
    'payment.myPayments': () => paymentMyPayments(user, payload),
    'payment.pending': () => paymentPending(user),
    'payment.all': () => paymentAll(user, payload),
    'payment.approve': () => paymentApprove(user, payload),
    'payment.reject': () => paymentReject(user, payload),
    'payment.paidPeriods': () => paymentPaidPeriods(user, payload),
    'payment.unpaidUsers': () => paymentUnpaidUsers(user, payload),
    
    // Agenda
    'agenda.list': () => agendaList(user, payload),
    'agenda.detail': () => agendaDetail(user, payload),
    'agenda.create': () => agendaCreate(user, payload),
    'agenda.update': () => agendaUpdate(user, payload),
    'agenda.updateStatus': () => agendaUpdateStatus(user, payload),
    'agenda.delete': () => agendaDelete(user, payload),
    
    // Information
    'info.list': () => infoList(user, payload),
    'info.detail': () => infoDetail(user, payload),
    'info.create': () => infoCreate(user, payload),
    'info.update': () => infoUpdate(user, payload),
    'info.togglePin': () => infoTogglePin(user, payload),
    'info.delete': () => infoDelete(user, payload),
    
    // Gallery
    'gallery.list': () => galleryList(user, payload),
    'gallery.upload': () => galleryUpload(user, payload),
    'gallery.delete': () => galleryDelete(user, payload),
    
    // Reviews
    'review.submit': () => reviewSubmit(user, payload),
    'review.myReview': () => reviewMyReview(user),
    'review.pending': () => reviewPending(user),
    'review.all': () => reviewAll(user, payload),
    'review.approve': () => reviewApprove(user, payload),
    'review.reject': () => reviewReject(user, payload),
    'review.delete': () => reviewDelete(user, payload),
    
    // Settings
    'settings.public': () => ({ ok: true, data: getPublicSettings() }),
    'settings.all': () => settingsAll(user),
    'settings.update': () => settingsUpdate(user, payload),
    'settings.updateCategories': () => settingsUpdateCategories(user, payload),
    
    // Role & Permissions
    'role.permissions': () => rolePermissions(user),
    'role.allPermissions': () => roleAllPermissions(user),
    'role.updatePermissions': () => roleUpdatePermissions(user, payload),
    'role.jabatanList': () => roleJabatanList(),
    
    // File
    'file.upload': () => fileUpload(user, payload),
  };
  
  const handler = routes[action];
  if (!handler) {
    return { ok: false, error: `Action '${action}' tidak ditemukan` };
  }
  
  return handler();
}

// ==================== DATABASE HELPERS ====================
function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETID);
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SCHEMAS[name];
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  
  return sheet;
}

function dbGetAll(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    })
    .filter(r => r.id);
}

function dbFind(sheetName, conditions) {
  const all = dbGetAll(sheetName);
  return all.filter(row =>
    Object.entries(conditions).every(([key, value]) => row[key] === value)
  );
}

function dbFindOne(sheetName, conditions) {
  return dbFind(sheetName, conditions)[0] || null;
}

function dbInsert(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = SCHEMAS[sheetName];
  const id = Utilities.getUuid();
  const now = new Date().toISOString();
  
  const row = headers.map(h => {
    if (h === 'id') return id;
    if (h === 'createdAt') return now;
    if (h === 'updatedAt') return now;
    return data[h] ?? '';
  });
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  
  return { ...data, id, createdAt: now };
}

function dbUpdate(sheetName, id, data) {
  const sheet = getSheet(sheetName);
  const lock = LockService.getScriptLock();
  
  try {
    // 1. Tunggu lock hingga 5 detik (meningkatkan peluang antrean berhasil)
    lock.waitLock(5000); 

    // 2. KRUSIAL: Ambil data TERBARU setelah mendapatkan lock
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const idIdx = headers.indexOf('id');
    const updatedAtIdx = headers.indexOf('updatedAt');

    if (idIdx === -1) throw new Error('Kolom ID tidak ditemukan');

    // Cari baris berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idIdx].toString() === id.toString()) {
        rowIndex = i + 1; // Konversi ke index baris spreadsheet (1-based)
        break;
      }
    }

    if (rowIndex === -1) throw new Error(`Data dengan ID ${id} tidak ditemukan`);

    // Update data pada baris tersebut
    Object.keys(data).forEach(key => {
      const colIdx = headers.indexOf(key);
      if (colIdx > -1 && key !== 'id') {
        sheet.getRange(rowIndex, colIdx + 1).setValue(data[key]);
      }
    });

    // Otomatis update kolom updatedAt jika ada
    if (updatedAtIdx > -1) {
      sheet.getRange(rowIndex, updatedAtIdx + 1).setValue(new Date());
    }

    // Pastikan semua perubahan tertulis sebelum lock dilepas
    SpreadsheetApp.flush();
    return true;

  } catch (error) {
    Logger.log(`Error di dbUpdate: ${error.message}`);
    throw error;
  } finally {
    // Selalu lepaskan lock
    lock.releaseLock();
  }
}

function dbDelete(sheetName, id) {
  const sheet = getSheet(sheetName);
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(5000);

    // Ambil data terbaru setelah lock
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const idIdx = headers.indexOf('id');

    if (idIdx === -1) throw new Error('Kolom ID tidak ditemukan');

    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idIdx].toString() === id.toString()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error(`Data dengan ID ${id} tidak ditemukan`);

    // Hapus baris
    sheet.deleteRow(rowIndex);
    
    SpreadsheetApp.flush();
    return true;

  } catch (error) {
    Logger.log(`Error di dbDelete: ${error.message}`);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

// ==================== AUTH FUNCTIONS ====================
function hashPassword(password) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA256, password + CONFIG.JWTSECRET)
  );
}

function createToken(userId) {
  const payload = {
    userId,
    exp: Date.now() + CONFIG.TOKENEXPIRYDAYS * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Utilities.base64Encode(JSON.stringify(payload));
  const signature = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA256, payloadB64 + CONFIG.JWTSECRET)
  );
  return `${payloadB64}.${signature}`;
}

function validateToken(token) {
  if (!token) return null;
  
  try {
    const [payloadB64, signature] = token.split('.');
    const expectedSig = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA256, payloadB64 + CONFIG.JWTSECRET)
    );
    
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(
      Utilities.newBlob(Utilities.base64Decode(payloadB64)).getDataAsString()
    );
    
    if (payload.exp < Date.now()) return null;
    
    const user = dbFindOne('users', { id: payload.userId });
    if (!user || user.status !== 'ACTIVE') return null;
    
    return user;
  } catch (e) {
    console.error('Token validation error:', e);
    return null;
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function authLogin({ email, password }) {
  if (!email || !password) {
    return { ok: false, error: 'Email dan password wajib diisi' };
  }
  
  const user = dbFindOne('users', { email: email.toLowerCase().trim() });
  
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Email atau password salah' };
  }
  
  if (user.status === 'PENDING') {
    return { ok: false, error: 'Akun Anda menunggu persetujuan admin' };
  }
  
  if (user.status === 'REJECTED') {
    return { ok: false, error: 'Akun Anda ditolak. Silakan hubungi admin.' };
  }
  
  if (user.status === 'BLOCKED') {
    return { ok: false, error: 'Akun Anda diblokir. Silakan hubungi admin.' };
  }
  
  return {
    ok: true,
    data: {
      user: sanitizeUser(user),
      token: createToken(user.id),
    },
  };
}

function authRegister({ nama, email, password, nik, telepon, blok, nomorRumah }) {
  const errors = {};
  
  if (!nama || nama.trim().length < 3) {
    errors.nama = 'Nama minimal 3 karakter';
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email tidak valid';
  }
  
  if (!password || password.length < 6) {
    errors.password = 'Password minimal 6 karakter';
  }
  
  // NIK is optional - only validate if provided
  if (nik && nik.length > 0) {
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      errors.nik = 'NIK harus 16 digit angka';
    }
  }
  
  if (!telepon || telepon.length < 10) {
    errors.telepon = 'Telepon minimal 10 digit';
  }
  
  if (!['A', 'B'].includes(blok)) {
    errors.blok = 'Blok tidak valid';
  }
  
  if (!nomorRumah || !nomorRumah.trim()) {
    errors.nomorRumah = 'Nomor rumah wajib diisi';
  }
  
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: 'Validasi gagal', errors };
  }
  
  const emailLower = email.toLowerCase().trim();
  if (dbFindOne('users', { email: emailLower })) {
    return { ok: false, error: 'Email sudah terdaftar' };
  }
  
  // Only check NIK duplicate if NIK is provided
  if (nik && nik.length > 0) {
    if (dbFindOne('users', { nik })) {
      return { ok: false, error: 'NIK sudah terdaftar' };
    }
  }
  
  dbInsert('users', {
    nama: nama.trim(),
    email: emailLower,
    passwordHash: hashPassword(password),
    nik,
    telepon: telepon.trim(),
    blok,
    nomorRumah: nomorRumah.trim(),
    role: 'WARGA',
    status: 'PENDING',
    photoUrl: '',
  });
  
  return {
    ok: true,
    data: { message: 'Registrasi berhasil. Menunggu persetujuan admin.' },
  };
}

function authChangePassword(user, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    return { ok: false, error: 'Password lama dan baru wajib diisi' };
  }
  
  if (newPassword.length < 6) {
    return { ok: false, error: 'Password baru minimal 6 karakter' };
  }
  
  const currentUser = dbFindOne('users', { id: user.id });
  if (currentUser.passwordHash !== hashPassword(oldPassword)) {
    return { ok: false, error: 'Password lama salah' };
  }
  
  dbUpdate('users', user.id, { passwordHash: hashPassword(newPassword) });
  
  return { ok: true, data: { message: 'Password berhasil diubah' } };
}

// ==================== FORGOT PASSWORD FUNCTIONS ====================
/**
 * Generate a random reset token
 */
function generateResetToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Forgot Password - Send reset link to user's email
 * Since GAS cannot send emails directly to arbitrary addresses,
 * this returns the reset token which frontend can use to show reset form
 * or send via external email service
 */
function authForgotPassword({ email }) {
  if (!email) {
    return { ok: false, error: 'Email wajib diisi' };
  }
  
  const emailLower = email.toLowerCase().trim();
  const user = dbFindOne('users', { email: emailLower });
  
  // Always return success to prevent email enumeration
  // But only create token if user exists
  if (!user) {
    return { 
      ok: true, 
      data: { 
        message: 'Jika email terdaftar, link reset password akan dikirim ke email tersebut.',
        tokenSent: false
      } 
    };
  }
  
  // Check if user is active
  if (user.status !== 'ACTIVE') {
    return { 
      ok: true, 
      data: { 
        message: 'Jika email terdaftar, link reset password akan dikirim ke email tersebut.',
        tokenSent: false
      } 
    };
  }
  
  // Invalidate any existing reset tokens for this user
  const existingTokens = dbFind('passwordResetTokens', { userId: user.id, usedAt: '' });
  for (const t of existingTokens) {
    if (!t.usedAt) {
      dbUpdate('passwordResetTokens', t.id, { usedAt: new Date().toISOString() });
    }
  }
  
  // Generate new token (expires in 1 hour)
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  
  dbInsert('passwordResetTokens', {
    userId: user.id,
    token: resetToken,
    expiresAt: expiresAt,
    usedAt: '',
  createdAt: new Date().toISOString()
  });
  
  // Build reset URL
  const resetUrl = `https://your-frontend-url.com/reset-password?token=${resetToken}`;
  
  // In Google Apps Script, we can use MailApp to send email
  // Uncomment the following lines if you want to send actual emails:
  /*
  try {
    MailApp.sendEmail({
      to: user.email,
      subject: 'Reset Password - Aplikasi Warga Pradha Ciganitri',
      htmlBody: `
        <p>Halo ${user.nama},</p>
        <p>Anda telah meminta untuk mereset password akun Anda.</p>
        <p>Klik link berikut untuk mereset password Anda:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Link ini akan kadaluarsa dalam 1 jam.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <p>Terima kasih,<br>Tim Aplikasi Warga Pradha Ciganitri</p>
      `
    });
  } catch (e) {
    console.error('Failed to send email:', e);
  }
  */
  
  // Return token info (for demo/testing purposes)
  // In production, you should not return the token in response
  return {
    ok: true,
    data: {
      message: 'Jika email terdaftar, link reset password akan dikirim ke email tersebut.',
      tokenSent: true,
      // For development/testing - remove in production
      resetToken: resetToken,
      resetUrl: resetUrl,
      expiresAt: expiresAt
    }
  };
}

/**
 * Reset Password - Validate token and update password
 */
function authResetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    return { ok: false, error: 'Token dan password baru wajib diisi' };
  }
  
  if (newPassword.length < 6) {
    return { ok: false, error: 'Password baru minimal 6 karakter' };
  }
  
  // Find the token
  const resetRecord = dbFindOne('passwordResetTokens', { token });
  
  if (!resetRecord) {
    return { ok: false, error: 'Token tidak valid atau sudah kadaluarsa' };
  }
  
  // Check if already used
  if (resetRecord.usedAt) {
    return { ok: false, error: 'Token sudah digunakan' };
  }
  
  // Check if expired
  if (new Date(resetRecord.expiresAt) < new Date()) {
    return { ok: false, error: 'Token sudah kadaluarsa' };
  }
  
  // Find the user
  const user = dbFindOne('users', { id: resetRecord.userId });
  
  if (!user || user.status !== 'ACTIVE') {
    return { ok: false, error: 'User tidak ditemukan atau tidak aktif' };
  }
  
  // Update password
  dbUpdate('users', user.id, { passwordHash: hashPassword(newPassword) });
  
  // Mark token as used
  dbUpdate('passwordResetTokens', resetRecord.id, { usedAt: new Date().toISOString() });
  
  return {
    ok: true,
    data: { message: 'Password berhasil direset. Silakan login dengan password baru.' }
  };
}

// ==================== PERMISSION HELPERS ====================
function getUserPermissions(user) {
  const customPerm = dbFindOne('permissions', { role: user.role });
  if (customPerm && customPerm.permissions) {
    try {
      return JSON.parse(customPerm.permissions);
    } catch (e) {
      console.error('Failed to parse permissions:', e);
    }
  }
  
  return getDefaultPermissions(user.role);
}

function getDefaultPermissions(role) {
  const defaults = {
    SUPERADMIN: {
      canViewAllUsers: true,
      canViewOwnBlokUsers: true,
      canApproveUsers: true,
      canRejectUsers: true,
      canChangeUserRole: true,
      canBlockUsers: true,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: true,
      canSubmitPayment: true,
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: true,
      canEditAgenda: true,
      canDeleteAgenda: true,
      canCreateInformation: true,
      canEditInformation: true,
      canDeleteInformation: true,
      canUploadGallery: true,
      canDeleteGallery: true,
      canApproveReviews: true,
      canDeleteReviews: true,
      canManageSettings: true,
      canManageRoles: true,
    },
    ADMIN: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: true,
      canApproveUsers: true,
      canRejectUsers: true,
      canChangeUserRole: false,
      canBlockUsers: true,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: false,
      canSubmitPayment: true,
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: true,
      canEditAgenda: true,
      canDeleteAgenda: true,
      canCreateInformation: true,
      canEditInformation: true,
      canDeleteInformation: true,
      canUploadGallery: true,
      canDeleteGallery: true,
      canApproveReviews: true,
      canDeleteReviews: true,
      canManageSettings: false,
      canManageRoles: false,
    },
    BENDAHARA: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: true,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: false,
      canSubmitPayment: true,
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: false,
      canEditAgenda: false,
      canDeleteAgenda: false,
      canCreateInformation: false,
      canEditInformation: false,
      canDeleteInformation: false,
      canUploadGallery: false,
      canDeleteGallery: false,
      canApproveReviews: false,
      canDeleteReviews: false,
      canManageSettings: false,
      canManageRoles: false,
    },
    WARGA: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: false,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: true,
      canCreateTransaction: false,
      canEditTransaction: false,
      canDeleteTransaction: false,
      canSubmitPayment: true,
      canApprovePayment: false,
      canRejectPayment: false,
      canViewAllPayments: false,
      canCreateAgenda: false,
      canEditAgenda: false,
      canDeleteAgenda: false,
      canCreateInformation: false,
      canEditInformation: false,
      canDeleteInformation: false,
      canUploadGallery: false,
      canDeleteGallery: false,
      canApproveReviews: false,
      canDeleteReviews: false,
      canManageSettings: false,
      canManageRoles: false,
    },
  };
  
  return defaults[role] || defaults.WARGA;
}

function hasPermission(user, permission) {
  const perms = getUserPermissions(user);
  return perms[permission] === true;
}

function requirePermission(user, permission) {
  if (!hasPermission(user, permission)) {
    return { ok: false, error: 'Anda tidak memiliki akses untuk melakukan ini' };
  }
  return null;
}

// ==================== PUBLIC API FUNCTIONS ====================

function financePublicSummary() {
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get('publicFinanceSummary');
  
  if (cachedData) {
    return { ok: true, data: JSON.parse(cachedData) };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  let allTransactions = dbGetAll('transactions');
  
  const currentMonthTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });
  
  const currentYearTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year;
  });
  
  const totalPemasukanBulanIni = currentMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalPengeluaranBulanIni = currentMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const saldoAwalA = getSaldoAwal('A', year);
  const saldoAwalB = getSaldoAwal('B', year);
  
  const totalPemasukanTahunIni = currentYearTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalPengeluaranTahunIni = currentYearTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const saldoAkhir = (saldoAwalA + saldoAwalB) + totalPemasukanTahunIni - totalPengeluaranTahunIni;
  
  const monthNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const resultData = {
    saldoAkhir,
    totalPemasukanBulanIni,
    totalPengeluaranBulanIni,
    periodLabel: `${monthNames[month]} ${year}`,
    lastUpdated: now.toISOString(),
  };

  cache.put('publicFinanceSummary', JSON.stringify(resultData), 21600);

  return { ok: true, data: resultData };
}

function agendaPublicList({ limit }) {
  let agenda = dbGetAll('agenda');
  
  agenda = agenda.filter(a => 
    a.status === 'UPCOMING' || a.status === 'ONGOING'
  );
  
  agenda = agenda.filter(a => a.targetBlok === 'ALL');
  
  agenda.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  if (limit) {
    agenda = agenda.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: agenda };
}

function infoPublicList({ limit }) {
  let info = dbGetAll('information');
  
  info = info.filter(i => i.targetBlok === 'ALL');
  
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  info = info.filter(i => !i.expiredAt || i.expiredAt >= today);
  
  info.sort((a, b) => {
    const aPin = a.isPinned === true || a.isPinned === 'true';
    const bPin = b.isPinned === true || b.isPinned === 'true';
    if (aPin && !bPin) return -1;
    if (!aPin && bPin) return 1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  
  if (limit) {
    info = info.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: info };
}

function pengurusPublicList() {
  const users = dbGetAll('users');
  const settings = getPublicSettings();
  
  // Get dynamic jabatan config or fallback to hardcoded
  let jabatanMap = ALL_JABATAN;
  if (settings.jabatanConfig) {
    jabatanMap = {};
    const perBlok = settings.jabatanConfig.perBlok || [];
    const bersama = settings.jabatanConfig.bersama || [];
    for (const j of perBlok) {
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
    for (const j of bersama) {
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
  }
  
  const pengurus = users.filter(u => 
    u.status === 'ACTIVE' && 
    (['SUPERADMIN', 'ADMIN', 'BENDAHARA'].includes(u.role) || (u.jabatan && u.jabatan !== ''))
  );
  
  const publicPengurus = pengurus.map(u => ({
    id: u.id,
    nama: u.nama,
    role: u.role,
    blok: u.blok,
    telepon: u.telepon,
    photoUrl: u.photoUrl || '',
    jabatan: u.jabatan || '',
    jabatanLabel: u.jabatan && jabatanMap[u.jabatan] ? jabatanMap[u.jabatan].label : '',
  }));
  
  // Sort by jabatan order, then by role
  publicPengurus.sort((a, b) => {
    const aJabatanOrder = a.jabatan && jabatanMap[a.jabatan] ? jabatanMap[a.jabatan].order : 100;
    const bJabatanOrder = b.jabatan && jabatanMap[b.jabatan] ? jabatanMap[b.jabatan].order : 100;
    
    if (aJabatanOrder !== bJabatanOrder) {
      return aJabatanOrder - bJabatanOrder;
    }
    
    const roleOrder = { 'SUPERADMIN': 0, 'ADMIN': 1, 'BENDAHARA': 2, 'WARGA': 3 };
    return roleOrder[a.role] - roleOrder[b.role];
  });
  
  return { ok: true, data: publicPengurus };
}

// ==================== STRUKTUR ORGANISASI (NEW v3) ====================
function pengurusStrukturOrganisasi() {
  const users = dbGetAll('users');
  const settings = getPublicSettings();
  
  // Get dynamic jabatan config or fallback to hardcoded
  let jabatanMap = {};
  
  if (settings.jabatanConfig) {
    // Build jabatan map from dynamic config
    const perBlok = settings.jabatanConfig.perBlok || [];
    const bersama = settings.jabatanConfig.bersama || [];
    
    for (const j of perBlok) {
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
    for (const j of bersama) {
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
  } else {
    // Fallback to hardcoded
    jabatanMap = ALL_JABATAN;
  }
  
  // Filter only active users with jabatan
  const pengurusAktif = users.filter(u => 
    u.status === 'ACTIVE' && u.jabatan && u.jabatan !== '' && jabatanMap[u.jabatan]
  );
  
  // Build structure per blok
  const struktur = {
    blokA: {
      label: 'Blok A',
      kontakRT: settings.kontakRTA || null,
      pengurus: []
    },
    blokB: {
      label: 'Blok B',
      kontakRT: settings.kontakRTB || null,
      pengurus: []
    },
    bersama: {
      label: 'Bersama',
      pengurus: []
    }
  };
  
  for (const u of pengurusAktif) {
    const jabatanInfo = jabatanMap[u.jabatan];
    if (!jabatanInfo) continue;
    
    const pengurusData = {
      id: u.id,
      nama: u.nama,
      blok: u.blok,
      telepon: u.telepon,
      photoUrl: u.photoUrl || '',
      jabatan: u.jabatan,
      jabatanLabel: jabatanInfo.label,
      order: jabatanInfo.order
    };
    
    // Cek apakah jabatan bersama atau per blok
    if (jabatanInfo.scope === 'SHARED') {
      // Jabatan bersama (Keamanan, Kebersihan, DKM Masjid)
      struktur.bersama.pengurus.push(pengurusData);
    } else {
      // Jabatan per blok
      if (u.blok === 'A') {
        struktur.blokA.pengurus.push(pengurusData);
      } else if (u.blok === 'B') {
        struktur.blokB.pengurus.push(pengurusData);
      }
    }
  }
  
  // Sort each section by jabatan order
  const sortByOrder = (a, b) => a.order - b.order;
  struktur.blokA.pengurus.sort(sortByOrder);
  struktur.blokB.pengurus.sort(sortByOrder);
  struktur.bersama.pengurus.sort(sortByOrder);
  
  return { ok: true, data: struktur };
}

function reviewPublicList({ limit }) {
  let reviews = dbGetAll('reviews');
  
  reviews = reviews.filter(r => r.status === 'APPROVED');
  
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (limit) {
    reviews = reviews.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: reviews };
}

function galleryPublicList({ limit }) {
  let gallery = dbGetAll('gallery');
  
  gallery.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (limit) {
    gallery = gallery.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: gallery };
}

// ==================== USER MANAGEMENT ====================
function userList(user, { blok, status, search }) {
  const canViewAll = hasPermission(user, 'canViewAllUsers');
  const canViewOwnBlok = hasPermission(user, 'canViewOwnBlokUsers');
  
  if (!canViewAll && !canViewOwnBlok) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  let users = dbGetAll('users');
  
  if (!canViewAll) {
    users = users.filter(u => u.blok === user.blok);
  }
  
  if (blok) {
    users = users.filter(u => u.blok === blok);
  }
  
  if (status) {
    users = users.filter(u => u.status === status);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(u =>
      u.nama.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.nomorRumah.toLowerCase().includes(searchLower)
    );
  }
  
  users.sort((a, b) => a.nama.localeCompare(b.nama));
  
  return { ok: true, data: users.map(sanitizeUser) };
}

function userDetail(user, { userId }) {
  const permCheck = requirePermission(user, 'canViewOwnBlokUsers');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  return { ok: true, data: sanitizeUser(target) };
}

function userPending(user) {
  const canViewAll = hasPermission(user, 'canViewAllUsers');
  const canViewOwnBlok = hasPermission(user, 'canViewOwnBlokUsers');
  
  if (!canViewAll && !canViewOwnBlok) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  let pending = dbFind('users', { status: 'PENDING' });
  
  if (!canViewAll) {
    pending = pending.filter(u => u.blok === user.blok);
  }
  
  pending.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return { ok: true, data: pending.map(sanitizeUser) };
}

function userApprove(user, { userId }) {
  const permCheck = requirePermission(user, 'canApproveUsers');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (target.status !== 'PENDING') {
    return { ok: false, error: 'User tidak dalam status pending' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat menyetujui user dari blok lain' };
  }
  
  dbUpdate('users', userId, { status: 'ACTIVE' });
  
  return { ok: true, data: { message: 'User berhasil disetujui' } };
}

function userReject(user, { userId, reason }) {
  const permCheck = requirePermission(user, 'canRejectUsers');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (target.status !== 'PENDING') {
    return { ok: false, error: 'User tidak dalam status pending' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat menolak user dari blok lain' };
  }
  
  dbUpdate('users', userId, { status: 'REJECTED' });
  
  return { ok: true, data: { message: 'User ditolak' } };
}

function userUpdateRole(user, { userId, role }) {
  const permCheck = requirePermission(user, 'canChangeUserRole');
  if (permCheck) return permCheck;
  
  const validRoles = ['WARGA', 'BENDAHARA', 'ADMIN', 'SUPERADMIN'];
  if (!validRoles.includes(role)) {
    return { ok: false, error: 'Role tidak valid' };
  }
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (target.id === user.id) {
    return { ok: false, error: 'Tidak dapat mengubah role sendiri' };
  }
  
  if (role === 'SUPERADMIN' && user.role !== 'SUPERADMIN') {
    return { ok: false, error: 'Hanya SUPERADMIN yang dapat memberikan role SUPERADMIN' };
  }
  
  dbUpdate('users', userId, { role });
  
  return { ok: true, data: { message: `Role berhasil diubah menjadi ${role}` } };
}

function userBlock(user, { userId, reason }) {
  const permCheck = requirePermission(user, 'canBlockUsers');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (target.id === user.id) {
    return { ok: false, error: 'Tidak dapat memblokir diri sendiri' };
  }
  
  if (target.role === 'SUPERADMIN') {
    return { ok: false, error: 'Tidak dapat memblokir SUPERADMIN' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat memblokir user dari blok lain' };
  }
  
  dbUpdate('users', userId, { status: 'BLOCKED' });
  
  return { ok: true, data: { message: 'User berhasil diblokir' } };
}

function userUnblock(user, { userId }) {
  const permCheck = requirePermission(user, 'canBlockUsers');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  if (target.status !== 'BLOCKED') {
    return { ok: false, error: 'User tidak dalam status diblokir' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat membuka blokir user dari blok lain' };
  }
  
  dbUpdate('users', userId, { status: 'ACTIVE' });
  
  return { ok: true, data: { message: 'Blokir user berhasil dibuka' } };
}

function userUpdate(user, { telepon, nama, photoUrl, nik }) {
  const updates = {};
  
  if (telepon !== undefined) {
    if (telepon.length < 10) {
      return { ok: false, error: 'Telepon minimal 10 digit' };
    }
    updates.telepon = telepon.trim();
  }
  
  if (nama !== undefined) {
    if (nama.trim().length < 3) {
      return { ok: false, error: 'Nama minimal 3 karakter' };
    }
    updates.nama = nama.trim();
  }
  
  if (photoUrl !== undefined) {
    updates.photoUrl = photoUrl;
  }
  
  // NIK is optional - validate if provided
  if (nik !== undefined) {
    if (nik && nik.length > 0) {
      if (nik.length !== 16 || !/^\d+$/.test(nik)) {
        return { ok: false, error: 'NIK harus 16 digit angka' };
      }
      // Check duplicate NIK (exclude current user)
      const existingNik = dbFindOne('users', { nik });
      if (existingNik && existingNik.id !== user.id) {
        return { ok: false, error: 'NIK sudah digunakan oleh user lain' };
      }
    }
    updates.nik = nik;
  }
  
  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'Tidak ada data yang diubah' };
  }
  
  const updated = dbUpdate('users', user.id, updates);
  
  return { ok: true, data: sanitizeUser(updated) };
}

function userUpdateJabatan(user, { userId, jabatan }) {
  // Only SUPERADMIN or ADMIN can update jabatan
  const permCheck = requirePermission(user, 'canChangeUserRole');
  if (permCheck) return permCheck;
  
  const target = dbFindOne('users', { id: userId });
  if (!target) {
    return { ok: false, error: 'User tidak ditemukan' };
  }
  
  // Get dynamic jabatan config
  const settings = getPublicSettings();
  let validJabatan = [];
  let jabatanMap = ALL_JABATAN;
  
  if (settings.jabatanConfig) {
    jabatanMap = {};
    const perBlok = settings.jabatanConfig.perBlok || [];
    const bersama = settings.jabatanConfig.bersama || [];
    for (const j of perBlok) {
      validJabatan.push(j.key);
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
    for (const j of bersama) {
      validJabatan.push(j.key);
      jabatanMap[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
  } else {
    validJabatan = VALID_JABATAN;
  }
  
  // Validate jabatan (empty string means remove jabatan)
  if (jabatan !== '' && !validJabatan.includes(jabatan)) {
    return { ok: false, error: 'Jabatan tidak valid' };
  }
  
  // Check scope - only ADMIN can update users in their blok
  if (!hasPermission(user, 'canViewAllUsers') && target.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat mengubah jabatan user dari blok lain' };
  }
  
  dbUpdate('users', userId, { jabatan, updatedAt: new Date().toISOString() });
  
  const jabatanLabel = jabatan && jabatanMap[jabatan] ? jabatanMap[jabatan].label : '';
  
  return { 
    ok: true, 
    data: { 
      message: jabatan ? `Jabatan berhasil diubah menjadi ${jabatanLabel}` : 'Jabatan berhasil dihapus',
      jabatan,
      jabatanLabel
    } 
  };
}

// ==================== FINANCE FUNCTIONS ====================
function getSaldoAwal(blok, year) {
  const record = dbFindOne('saldoawal', { blok, year: String(year) });
  return record ? Number(record.amount) : 0;
}

function financeSummary(user, { year, month }) {
  const permCheck = requirePermission(user, 'canViewFinance');
  if (permCheck) return permCheck;
  
  const y = parseInt(year) || new Date().getFullYear();
  const m = month ? parseInt(month) : null;
  
  let transactions = dbFind('transactions', { blok: user.blok });
  
  transactions = transactions.filter(t => {
    const d = new Date(t.date);
    if (d.getFullYear() !== y) return false;
    if (m !== null && (d.getMonth() + 1) !== m) return false;
    return true;
  });
  
  const totalPemasukan = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalPengeluaran = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const saldoAwal = getSaldoAwal(user.blok, y);
  
  const periodLabel = m
    ? `${getMonthName(m)} ${y}`
    : `Tahun ${y}`;
  
  return {
    ok: true,
    data: {
      saldoAwal,
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir: saldoAwal + totalPemasukan - totalPengeluaran,
      periodLabel,
    },
  };
}

function getMonthName(month) {
  const months = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month] || '';
}

function financeTransactions(user, { year, month, type, limit }) {
  const permCheck = requirePermission(user, 'canViewFinance');
  if (permCheck) return permCheck;
  
  let transactions = dbFind('transactions', { blok: user.blok });
  
  if (year) {
    const y = parseInt(year);
    transactions = transactions.filter(t => new Date(t.date).getFullYear() === y);
  }
  
  if (month) {
    const m = parseInt(month);
    transactions = transactions.filter(t => (new Date(t.date).getMonth() + 1) === m);
  }
  
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }
  
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (limit) {
    transactions = transactions.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: transactions };
}

function financeCreate(user, { type, category, amount, description, date }) {
  const permCheck = requirePermission(user, 'canCreateTransaction');
  if (permCheck) return permCheck;
  
  const errors = {};
  
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    errors.type = 'Tipe transaksi tidak valid';
  }
  
  if (!category || !category.trim()) {
    errors.category = 'Kategori wajib diisi';
  }
  
  const amountNum = Math.floor(Number(amount));
  if (isNaN(amountNum) || amountNum <= 0) {
    errors.amount = 'Nominal harus lebih dari 0';
  }
  
  if (!description || description.trim().length < 3) {
    errors.description = 'Keterangan minimal 3 karakter';
  }
  
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: 'Validasi gagal', errors };
  }
  
  const record = dbInsert('transactions', {
    blok: user.blok,
    type,
    category: category.trim(),
    amount: amountNum,
    description: description.trim(),
    date: date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    paymentId: '', // Empty for manual transactions
    createdBy: user.nama,
  });
  
  CacheService.getScriptCache().remove('publicFinanceSummary');
  
  return {
    ok: true,
    data: { message: 'Transaksi berhasil ditambahkan', id: record.id },
  };
}

function financeUpdate(user, { id, category, amount, description, date }) {
  const permCheck = requirePermission(user, 'canEditTransaction');
  if (permCheck) return permCheck;
  
  const transaction = dbFindOne('transactions', { id });
  if (!transaction) {
    return { ok: false, error: 'Transaksi tidak ditemukan' };
  }
  
  if (transaction.blok !== user.blok && !hasPermission(user, 'canViewAllUsers')) {
    return { ok: false, error: 'Tidak dapat mengedit transaksi blok lain' };
  }
  
  const updates = {};
  
  if (category !== undefined) updates.category = category.trim();
  if (amount !== undefined) {
    const amountNum = Math.floor(Number(amount));
    if (isNaN(amountNum) || amountNum <= 0) {
      return { ok: false, error: 'Nominal harus lebih dari 0' };
    }
    updates.amount = amountNum;
  }
  if (description !== undefined) updates.description = description.trim();
  if (date !== undefined) updates.date = date;
  
  dbUpdate('transactions', id, updates);
  
  CacheService.getScriptCache().remove('publicFinanceSummary');

  return { ok: true, data: { message: 'Transaksi berhasil diperbarui' } };
}

function financeDelete(user, { id }) {
  const permCheck = requirePermission(user, 'canDeleteTransaction');
  if (permCheck) return permCheck;
  
  const transaction = dbFindOne('transactions', { id });
  if (!transaction) {
    return { ok: false, error: 'Transaksi tidak ditemukan' };
  }
  
  dbDelete('transactions', id);
  
  CacheService.getScriptCache().remove('publicFinanceSummary');
  
  return { ok: true, data: { message: 'Transaksi berhasil dihapus' } };
}

function financeSetSaldoAwal(user, { blok, year, amount }) {
  const permCheck = requirePermission(user, 'canCreateTransaction');
  if (permCheck) return permCheck;
  
  if (!['A', 'B'].includes(blok)) {
    return { ok: false, error: 'Blok tidak valid' };
  }
  
  const amountNum = Math.floor(Number(amount));
  if (isNaN(amountNum) || amountNum < 0) {
    return { ok: false, error: 'Saldo tidak boleh negatif' };
  }
  
  const existing = dbFindOne('saldoawal', { blok, year: String(year) });
  
  if (existing) {
    dbUpdate('saldoawal', existing.id, { amount: amountNum });
  } else {
    dbInsert('saldoawal', { blok, year: String(year), amount: amountNum });
  }
  
  return { ok: true, data: { message: 'Saldo awal berhasil diatur' } };
}

// ==================== PAYMENT FUNCTIONS ====================
function paymentSubmit(user, { periods, buktiUrl }) {
  const permCheck = requirePermission(user, 'canSubmitPayment');
  if (permCheck) return permCheck;
  
  if (!periods || !Array.isArray(periods) || periods.length === 0) {
    return { ok: false, error: 'Pilih minimal 1 periode pembayaran' };
  }
  
  if (!buktiUrl) {
    return { ok: false, error: 'Upload bukti transfer' };
  }
  
  const paidPeriods = getPaidPeriodsForUser(user.id);
  const duplicates = periods.filter(p => paidPeriods.includes(p));
  
  if (duplicates.length > 0) {
    return { ok: false, error: `Periode ${duplicates.join(', ')} sudah dibayar` };
  }
  
  const pendingPayments = dbFind('payments', { userId: user.id, status: 'PENDING' });
  for (const payment of pendingPayments) {
    const paymentPeriods = JSON.parse(payment.periods || '[]');
    const overlap = periods.filter(p => paymentPeriods.includes(p));
    if (overlap.length > 0) {
      return { ok: false, error: `Periode ${overlap.join(', ')} sedang dalam verifikasi` };
    }
  }
  
  const settings = getPublicSettings();
  const tarifIuran = settings.monthlyFee || settings.tarifIuran || 50000;
  const amount = periods.length * tarifIuran;
  
  dbInsert('payments', {
    userId: user.id,
    userName: user.nama,
    blok: user.blok,
    nomorRumah: user.nomorRumah,
    periods: JSON.stringify(periods),
    amount,
    buktiUrl,
    status: 'PENDING',
  });
  
  return { ok: true, data: { message: 'Pembayaran berhasil diajukan. Menunggu verifikasi admin/bendahara.' } };
}

function getPaidPeriodsForUser(userId) {
  // Only return periods from APPROVED payments
  const approved = dbFind('payments', { userId, status: 'APPROVED' });
  const periods = [];
  
  for (const payment of approved) {
    try {
      const parsed = JSON.parse(payment.periods || '[]');
      periods.push(...parsed);
    } catch (e) {
      console.error('Failed to parse periods:', e);
    }
  }
  
  return [...new Set(periods)];
}

function paymentMyPayments(user, { year }) {
  let payments = dbFind('payments', { userId: user.id });
  
  if (year) {
    payments = payments.filter(p => {
      const created = new Date(p.createdAt);
      return created.getFullYear() === parseInt(year);
    });
  }
  
  const result = payments.map(p => ({
    ...p,
    periods: JSON.parse(p.periods || '[]'),
  }));
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return { ok: true, data: result };
}

function paymentPending(user) {
  const permCheck = requirePermission(user, 'canApprovePayment');
  if (permCheck) return permCheck;
  
  let payments = dbFind('payments', { status: 'PENDING' });
  
  if (!hasPermission(user, 'canViewAllUsers')) {
    payments = payments.filter(p => p.blok === user.blok);
  }
  
  const result = payments.map(p => ({
    ...p,
    periods: JSON.parse(p.periods || '[]'),
  }));
  
  result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return { ok: true, data: result };
}

function paymentAll(user, { blok, status, year }) {
  const permCheck = requirePermission(user, 'canViewAllPayments');
  if (permCheck) return permCheck;
  
  let payments = dbGetAll('payments');
  
  if (!hasPermission(user, 'canViewAllUsers')) {
    payments = payments.filter(p => p.blok === user.blok);
  }
  
  if (blok) {
    payments = payments.filter(p => p.blok === blok);
  }
  
  if (status) {
    payments = payments.filter(p => p.status === status);
  }
  
  if (year) {
    payments = payments.filter(p => {
      const created = new Date(p.createdAt);
      return created.getFullYear() === parseInt(year);
    });
  }
  
  const result = payments.map(p => ({
    ...p,
    periods: JSON.parse(p.periods || '[]'),
  }));
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return { ok: true, data: result };
}

// ==================== PAYMENT APPROVE (UPDATED) ====================
// Updated: Now includes paymentId in the created transaction for traceability
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
  
  // Update payment status
  dbUpdate('payments', paymentId, {
    status: 'APPROVED',
    processedBy: user.nama,
    processedAt: new Date().toISOString(),
  });
  
  // Create income transaction with paymentId for traceability
  const periods = JSON.parse(payment.periods || '[]');
  dbInsert('transactions', {
    blok: payment.blok,
    type: 'INCOME',
    category: 'Iuran Bulanan',
    amount: payment.amount,
    description: `Iuran ${payment.userName} (Blok ${payment.blok}, No. ${payment.nomorRumah}) - ${periods.join(', ')}`,
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    paymentId: paymentId, // Link to payment for traceability
    createdBy: user.nama,
  });
  
  // Clear cache
  CacheService.getScriptCache().remove('publicFinanceSummary');
  
  return { ok: true, data: { message: 'Pembayaran berhasil disetujui dan dicatat sebagai pemasukan' } };
}

function paymentReject(user, { paymentId, reason }) {
  const permCheck = requirePermission(user, 'canRejectPayment');
  if (permCheck) return permCheck;
  
  if (!reason || !reason.trim()) {
    return { ok: false, error: 'Alasan penolakan wajib diisi' };
  }
  
  const payment = dbFindOne('payments', { id: paymentId });
  if (!payment) {
    return { ok: false, error: 'Pembayaran tidak ditemukan' };
  }
  
  if (payment.status !== 'PENDING') {
    return { ok: false, error: 'Pembayaran sudah diproses' };
  }
  
  if (!hasPermission(user, 'canViewAllUsers') && payment.blok !== user.blok) {
    return { ok: false, error: 'Tidak dapat menolak pembayaran blok lain' };
  }
  
  dbUpdate('payments', paymentId, {
    status: 'REJECTED',
    processedBy: user.nama,
    processedAt: new Date().toISOString(),
    rejectReason: reason.trim(),
  });
  
  return { ok: true, data: { message: 'Pembayaran ditolak' } };
}

function paymentPaidPeriods(user, { userId }) {
  const targetUserId = userId || user.id;
  
  if (targetUserId !== user.id && !hasPermission(user, 'canViewAllPayments')) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  return { ok: true, data: getPaidPeriodsForUser(targetUserId) };
}

function paymentUnpaidUsers(user, { period }) {
  const permCheck = requirePermission(user, 'canViewAllPayments');
  if (permCheck) return permCheck;
  
  if (!period) {
    return { ok: false, error: 'Periode wajib diisi' };
  }
  
  let users = dbFind('users', { status: 'ACTIVE' });
  
  if (!hasPermission(user, 'canViewAllUsers')) {
    users = users.filter(u => u.blok === user.blok);
  }
  
  const unpaid = users.filter(u => {
    const paidPeriods = getPaidPeriodsForUser(u.id);
    return !paidPeriods.includes(period);
  });
  
  return { ok: true, data: unpaid.map(sanitizeUser) };
}

// ==================== AGENDA FUNCTIONS ====================
function agendaList(user, { status, limit, upcoming }) {
  let agenda = dbGetAll('agenda');
  
  agenda = agenda.filter(a => 
    a.targetBlok === 'ALL' || a.targetBlok === user.blok
  );
  
  if (status) {
    agenda = agenda.filter(a => a.status === status);
  }
  
  if (upcoming) {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    agenda = agenda.filter(a => a.startDate >= today || a.status === 'ONGOING');
  }
  
  agenda.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  if (limit) {
    agenda = agenda.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: agenda };
}

function agendaDetail(user, { id }) {
  const agenda = dbFindOne('agenda', { id });
  
  if (!agenda) {
    return { ok: false, error: 'Agenda tidak ditemukan' };
  }
  
  if (agenda.targetBlok !== 'ALL' && agenda.targetBlok !== user.blok) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  return { ok: true, data: agenda };
}

function agendaCreate(user, { title, description, location, startDate, endDate, startTime, endTime, targetBlok }) {
  const permCheck = requirePermission(user, 'canCreateAgenda');
  if (permCheck) return permCheck;
  
  const errors = {};
  
  if (!title || title.trim().length < 3) {
    errors.title = 'Judul minimal 3 karakter';
  }
  
  if (!description || description.trim().length < 10) {
    errors.description = 'Deskripsi minimal 10 karakter';
  }
  
  if (!location || location.trim().length < 3) {
    errors.location = 'Lokasi minimal 3 karakter';
  }
  
  if (!startDate) {
    errors.startDate = 'Tanggal mulai wajib diisi';
  }
  
  if (!['ALL', 'A', 'B'].includes(targetBlok)) {
    errors.targetBlok = 'Target blok tidak valid';
  }
  
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: 'Validasi gagal', errors };
  }
  
  const record = dbInsert('agenda', {
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    startDate,
    endDate: endDate || '',
    startTime: startTime || '',
    endTime: endTime || '',
    status: 'UPCOMING',
    targetBlok,
    createdBy: user.nama,
  });
  
  return {
    ok: true,
    data: { message: 'Agenda berhasil ditambahkan', id: record.id },
  };
}

function agendaUpdate(user, payload) {
  const permCheck = requirePermission(user, 'canEditAgenda');
  if (permCheck) return permCheck;
  
  const { id, ...updates } = payload;
  
  const agenda = dbFindOne('agenda', { id });
  if (!agenda) {
    return { ok: false, error: 'Agenda tidak ditemukan' };
  }
  
  const allowedFields = ['title', 'description', 'location', 'startDate', 'endDate', 'startTime', 'endTime', 'targetBlok'];
  const filteredUpdates = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  dbUpdate('agenda', id, filteredUpdates);
  
  return { ok: true, data: { message: 'Agenda berhasil diperbarui' } };
}

function agendaUpdateStatus(user, { id, status }) {
  const permCheck = requirePermission(user, 'canEditAgenda');
  if (permCheck) return permCheck;
  
  const validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return { ok: false, error: 'Status tidak valid' };
  }
  
  const agenda = dbFindOne('agenda', { id });
  if (!agenda) {
    return { ok: false, error: 'Agenda tidak ditemukan' };
  }
  
  dbUpdate('agenda', id, { status });
  
  return { ok: true, data: { message: 'Status agenda berhasil diperbarui' } };
}

function agendaDelete(user, { id }) {
  const permCheck = requirePermission(user, 'canDeleteAgenda');
  if (permCheck) return permCheck;
  
  const agenda = dbFindOne('agenda', { id });
  if (!agenda) {
    return { ok: false, error: 'Agenda tidak ditemukan' };
  }
  
  dbDelete('agenda', id);
  
  return { ok: true, data: { message: 'Agenda berhasil dihapus' } };
}

// ==================== INFORMATION FUNCTIONS ====================
function infoList(user, { category, pinned, limit }) {
  let info = dbGetAll('information');
  
  info = info.filter(i => 
    i.targetBlok === 'ALL' || i.targetBlok === user.blok
  );
  
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  info = info.filter(i => !i.expiredAt || i.expiredAt >= today);
  
  if (category) {
    info = info.filter(i => i.category === category);
  }
  
  if (pinned !== undefined) {
    info = info.filter(i => i.isPinned === pinned || i.isPinned === String(pinned));
  }
  
  info.sort((a, b) => {
    const aPin = a.isPinned === true || a.isPinned === 'true';
    const bPin = b.isPinned === true || b.isPinned === 'true';
    if (aPin && !bPin) return -1;
    if (!aPin && bPin) return 1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  
  if (limit) {
    info = info.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: info };
}

function infoDetail(user, { id }) {
  const info = dbFindOne('information', { id });
  
  if (!info) {
    return { ok: false, error: 'Informasi tidak ditemukan' };
  }
  
  if (info.targetBlok !== 'ALL' && info.targetBlok !== user.blok) {
    return { ok: false, error: 'Akses ditolak' };
  }
  
  return { ok: true, data: info };
}

function infoCreate(user, { title, content, category, isPinned, targetBlok, expiredAt }) {
  const permCheck = requirePermission(user, 'canCreateInformation');
  if (permCheck) return permCheck;
  
  const errors = {};
  
  if (!title || title.trim().length < 3) {
    errors.title = 'Judul minimal 3 karakter';
  }
  
  if (!content || content.trim().length < 10) {
    errors.content = 'Konten minimal 10 karakter';
  }
  
  if (!category) {
    errors.category = 'Kategori wajib dipilih';
  }
  
  if (!['ALL', 'A', 'B'].includes(targetBlok)) {
    errors.targetBlok = 'Target blok tidak valid';
  }
  
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: 'Validasi gagal', errors };
  }
  
  const record = dbInsert('information', {
    title: title.trim(),
    content: content.trim(),
    category,
    isPinned: isPinned === true || isPinned === 'true' ? 'true' : 'false',
    targetBlok,
    publishedAt: new Date().toISOString(),
    expiredAt: expiredAt || '',
    createdBy: user.nama,
  });
  
  return {
    ok: true,
    data: { message: 'Informasi berhasil ditambahkan', id: record.id },
  };
}

function infoUpdate(user, payload) {
  const permCheck = requirePermission(user, 'canEditInformation');
  if (permCheck) return permCheck;
  
  const { id, ...updates } = payload;
  
  const info = dbFindOne('information', { id });
  if (!info) {
    return { ok: false, error: 'Informasi tidak ditemukan' };
  }
  
  const allowedFields = ['title', 'content', 'category', 'targetBlok', 'expiredAt'];
  const filteredUpdates = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  dbUpdate('information', id, filteredUpdates);
  
  return { ok: true, data: { message: 'Informasi berhasil diperbarui' } };
}

function infoTogglePin(user, { id }) {
  const permCheck = requirePermission(user, 'canEditInformation');
  if (permCheck) return permCheck;
  
  const info = dbFindOne('information', { id });
  if (!info) {
    return { ok: false, error: 'Informasi tidak ditemukan' };
  }
  
  const currentlyPinned = info.isPinned === true || info.isPinned === 'true';
  dbUpdate('information', id, { isPinned: currentlyPinned ? 'false' : 'true' });
  
  return {
    ok: true,
    data: { message: currentlyPinned ? 'Informasi tidak lagi dipinned' : 'Informasi berhasil dipinned' },
  };
}

function infoDelete(user, { id }) {
  const permCheck = requirePermission(user, 'canDeleteInformation');
  if (permCheck) return permCheck;
  
  const info = dbFindOne('information', { id });
  if (!info) {
    return { ok: false, error: 'Informasi tidak ditemukan' };
  }
  
  dbDelete('information', id);
  
  return { ok: true, data: { message: 'Informasi berhasil dihapus' } };
}

// ==================== GALLERY FUNCTIONS ====================
function galleryList(user, { agendaId, limit }) {
  let gallery = dbGetAll('gallery');
  
  if (agendaId) {
    gallery = gallery.filter(g => g.agendaId === agendaId);
  }
  
  gallery.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (limit) {
    gallery = gallery.slice(0, parseInt(limit));
  }
  
  return { ok: true, data: gallery };
}

function galleryUpload(user, { title, imageUrl, agendaId, description, takenAt }) {
  const permCheck = requirePermission(user, 'canUploadGallery');
  if (permCheck) return permCheck;
  
  if (!title || title.trim().length < 3) {
    return { ok: false, error: 'Judul minimal 3 karakter' };
  }
  
  if (!imageUrl) {
    return { ok: false, error: 'Gambar wajib diupload' };
  }
  
  if (agendaId) {
    const agenda = dbFindOne('agenda', { id: agendaId });
    if (!agenda) {
      return { ok: false, error: 'Agenda tidak ditemukan' };
    }
  }
  
  const record = dbInsert('gallery', {
    agendaId: agendaId || '',
    title: title.trim(),
    description: description ? description.trim() : '',
    imageUrl,
    thumbnailUrl: imageUrl,
    takenAt: takenAt || '',
    uploadedBy: user.nama,
  });
  
  return {
    ok: true,
    data: { message: 'Foto berhasil diupload', id: record.id },
  };
}

function galleryDelete(user, { id }) {
  const permCheck = requirePermission(user, 'canDeleteGallery');
  if (permCheck) return permCheck;
  
  const item = dbFindOne('gallery', { id });
  if (!item) {
    return { ok: false, error: 'Foto tidak ditemukan' };
  }
  
  dbDelete('gallery', id);
  
  return { ok: true, data: { message: 'Foto berhasil dihapus' } };
}

// ==================== REVIEW FUNCTIONS ====================
function reviewSubmit(user, { rating, comment }) {
  const settings = getPublicSettings();
  if (settings.enableReviews === false) {
    return { ok: false, error: 'Fitur review sedang dinonaktifkan' };
  }
  
  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { ok: false, error: 'Rating harus antara 1-5' };
  }
  
  if (!comment || comment.trim().length < 10) {
    return { ok: false, error: 'Komentar minimal 10 karakter' };
  }
  
  if (comment.trim().length > 500) {
    return { ok: false, error: 'Komentar maksimal 500 karakter' };
  }
  
  const existingReview = dbFindOne('reviews', { userId: user.id });
  
  if (existingReview) {
    dbUpdate('reviews', existingReview.id, {
      rating: ratingNum,
      comment: comment.trim(),
      status: 'PENDING',
      userName: user.nama,
      userPhotoUrl: user.photoUrl || '',
    });
    return { ok: true, data: { message: 'Review berhasil diperbarui dan menunggu persetujuan' } };
  }
  
  dbInsert('reviews', {
    userId: user.id,
    userName: user.nama,
    userPhotoUrl: user.photoUrl || '',
    rating: ratingNum,
    comment: comment.trim(),
    status: 'PENDING',
  });
  
  return { ok: true, data: { message: 'Review berhasil dikirim dan menunggu persetujuan' } };
}

function reviewMyReview(user) {
  const review = dbFindOne('reviews', { userId: user.id });
  return { ok: true, data: review || null };
}

function reviewPending(user) {
  const permCheck = requirePermission(user, 'canApproveReviews');
  if (permCheck) return permCheck;
  
  const reviews = dbFind('reviews', { status: 'PENDING' });
  reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return { ok: true, data: reviews };
}

function reviewAll(user, { status }) {
  const permCheck = requirePermission(user, 'canApproveReviews');
  if (permCheck) return permCheck;
  
  let reviews = dbGetAll('reviews');
  
  if (status) {
    reviews = reviews.filter(r => r.status === status);
  }
  
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return { ok: true, data: reviews };
}

function reviewApprove(user, { reviewId }) {
  const permCheck = requirePermission(user, 'canApproveReviews');
  if (permCheck) return permCheck;
  
  const review = dbFindOne('reviews', { id: reviewId });
  if (!review) {
    return { ok: false, error: 'Review tidak ditemukan' };
  }
  
  if (review.status !== 'PENDING') {
    return { ok: false, error: 'Review sudah diproses' };
  }
  
  dbUpdate('reviews', reviewId, { status: 'APPROVED' });
  
  return { ok: true, data: { message: 'Review berhasil disetujui' } };
}

function reviewReject(user, { reviewId, reason }) {
  const permCheck = requirePermission(user, 'canApproveReviews');
  if (permCheck) return permCheck;
  
  const review = dbFindOne('reviews', { id: reviewId });
  if (!review) {
    return { ok: false, error: 'Review tidak ditemukan' };
  }
  
  if (review.status !== 'PENDING') {
    return { ok: false, error: 'Review sudah diproses' };
  }
  
  dbUpdate('reviews', reviewId, { status: 'REJECTED' });
  
  return { ok: true, data: { message: 'Review ditolak' } };
}

function reviewDelete(user, { reviewId }) {
  const permCheck = requirePermission(user, 'canDeleteReviews');
  if (permCheck) return permCheck;
  
  const review = dbFindOne('reviews', { id: reviewId });
  if (!review) {
    return { ok: false, error: 'Review tidak ditemukan' };
  }
  
  dbDelete('reviews', reviewId);
  
  return { ok: true, data: { message: 'Review berhasil dihapus' } };
}

// ==================== SETTINGS FUNCTIONS (UPDATED v2) ====================
// Updated: Added bankInfoA, bankInfoB, monthlyFee for bank info per blok
function getPublicSettings() {
  const defaults = {
    appName: 'IWK-RT Portal',
    rtName: 'RT 011',
    rwName: 'RW 005',
    address: 'Perumahan Indah Warga Kita',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    whatsappAdmin: '',
    monthlyFee: 50000, // NEW: Monthly fee (renamed from tarifIuran for consistency)
    tarifIuran: 50000, // Keep for backward compatibility
    // Bank info for Blok A
    bankInfoA: {
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankHolder: 'RT Pradha Ciganitri Blok A',
    },
    // Bank info for Blok B
    bankInfoB: {
      bankName: 'Mandiri',
      bankAccount: '0987654321',
      bankHolder: 'RT Pradha Ciganitri Blok B',
    },
    // Legacy bank info (for backward compatibility)
    bankName: '',
    bankAccount: '',
    bankHolder: '',
    enableRegistration: true,
    enablePaymentSubmission: true,
    enableAgenda: true,
    enableGallery: true,
    enableInformation: true,
    enablePublicFinance: true,
    enableReviews: true,
    primaryColor: '#2563eb',
    logoUrl: '',
    bannerUrl: '',
    googleMapsEmbedUrl: '',
    socialMediaLinks: [],
    incomeCategories: ['Iuran Bulanan', 'Dana Sosial', 'Lain-lain'],
    expenseCategories: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Administrasi', 'Lain-lain'],
    informationCategories: ['Pengumuman', 'Berita', 'Info Penting'],
    // Categories per Blok
    categoriesA: {
      income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'],
      expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'],
      information: ['Pengumuman', 'Berita', 'Info Penting'],
    },
    categoriesB: {
      income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'],
      expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'],
      information: ['Pengumuman', 'Berita', 'Info Penting'],
    },
    // Saldo Awal
    saldoAwalA: 0,
    saldoAwalB: 0,
    // Dynamic Jabatan Configuration (NEW)
    jabatanConfig: {
      perBlok: [
        { key: 'KETUA_RT', label: 'Ketua RT', order: 1, scope: 'BLOK' },
        { key: 'WAKIL_KETUA', label: 'Wakil Ketua RT', order: 2, scope: 'BLOK' },
        { key: 'SEKRETARIS', label: 'Sekretaris', order: 3, scope: 'BLOK' },
        { key: 'BENDAHARA', label: 'Bendahara', order: 4, scope: 'BLOK' },
      ],
      bersama: [
        { key: 'SIE_KEAMANAN', label: 'Sie. Keamanan', order: 10, scope: 'SHARED' },
        { key: 'SIE_KEBERSIHAN', label: 'Sie. Kebersihan', order: 11, scope: 'SHARED' },
        { key: 'DKM_MASJID', label: 'DKM Masjid Al Birr', order: 12, scope: 'SHARED' },
      ],
    },
    // Kontak RT per Blok (NEW)
    kontakRTA: {
      nama: '',
      telepon: '',
      alamat: '',
    },
    kontakRTB: {
      nama: '',
      telepon: '',
      alamat: '',
    },
  };
  
  const settings = dbGetAll('settings');
  
  for (const s of settings) {
    if (defaults.hasOwnProperty(s.key)) {
      let value = s.value;
      
      // Parse JSON for objects and arrays
      if (typeof defaults[s.key] === 'object' && !Array.isArray(defaults[s.key])) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = defaults[s.key];
        }
      } else if (typeof defaults[s.key] === 'boolean') {
        value = value === 'true' || value === true;
      } else if (Array.isArray(defaults[s.key])) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = defaults[s.key];
        }
      } else if (typeof defaults[s.key] === 'number') {
        value = Number(value);
      }
      
      defaults[s.key] = value;
    }
  }
  
  return defaults;
}

function settingsAll(user) {
  const permCheck = requirePermission(user, 'canManageSettings');
  if (permCheck) return permCheck;
  
  return { ok: true, data: getPublicSettings() };
}

function settingsUpdate(user, payload) {
  const permCheck = requirePermission(user, 'canManageSettings');
  if (permCheck) return permCheck;
  
  const allowedKeys = [
    'appName', 'rtName', 'rwName', 'address', 'kelurahan', 'kecamatan', 'kota',
    'whatsappAdmin', 'monthlyFee', 'tarifIuran',
    'bankInfoA', 'bankInfoB', 'bankName', 'bankAccount', 'bankHolder',
    'enableRegistration', 'enablePaymentSubmission', 'enableAgenda', 'enableGallery', 
    'enableInformation', 'enablePublicFinance', 'enableReviews',
    'primaryColor', 'logoUrl', 'bannerUrl', 'googleMapsEmbedUrl', 'socialMediaLinks',
    'incomeCategories', 'expenseCategories', 'informationCategories',
    'categoriesA', 'categoriesB',
    'saldoAwalA', 'saldoAwalB',
    'jabatanConfig', 'kontakRTA', 'kontakRTB',
  ];
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    
    for (const [key, value] of Object.entries(payload)) {
      if (!allowedKeys.includes(key)) continue;
      
      let storedValue = value;
      if (typeof value === 'boolean') {
        storedValue = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        storedValue = String(value);
      } else if (Array.isArray(value) || typeof value === 'object') {
        storedValue = JSON.stringify(value);
      }
      
      const existing = dbFindOne('settings', { key });
      if (existing) {
        dbUpdate('settings', existing.id, { value: storedValue });
      } else {
        const sheet = getSheet('settings');
        sheet.appendRow([key, storedValue]);
      }
    }
  } finally {
    lock.releaseLock();
  }
  
  // Clear public settings cache
  CacheService.getScriptCache().remove('publicFinanceSummary');
  
  return { ok: true, data: { message: 'Pengaturan berhasil disimpan' } };
}

function settingsUpdateCategories(user, { type, categories }) {
  const permCheck = requirePermission(user, 'canManageSettings');
  if (permCheck) return permCheck;
  
  const typeMap = {
    income: 'incomeCategories',
    expense: 'expenseCategories',
    information: 'informationCategories',
  };
  
  const key = typeMap[type];
  if (!key) {
    return { ok: false, error: 'Tipe kategori tidak valid' };
  }
  
  if (!Array.isArray(categories) || categories.length === 0) {
    return { ok: false, error: 'Kategori tidak boleh kosong' };
  }
  
  const storedValue = JSON.stringify(categories);
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    
    const existing = dbFindOne('settings', { key });
    if (existing) {
      dbUpdate('settings', existing.id, { value: storedValue });
    } else {
      const sheet = getSheet('settings');
      sheet.appendRow([key, storedValue]);
    }
  } finally {
    lock.releaseLock();
  }
  
  return { ok: true, data: { message: 'Kategori berhasil diperbarui' } };
}

// ==================== ROLE & PERMISSIONS FUNCTIONS ====================
function rolePermissions(user) {
  const permissions = getUserPermissions(user);
  
  return {
    ok: true,
    data: {
      role: user.role,
      permissions,
    },
  };
}

function roleAllPermissions(user) {
  const permCheck = requirePermission(user, 'canManageRoles');
  if (permCheck) return permCheck;
  
  const roles = ['SUPERADMIN', 'ADMIN', 'BENDAHARA', 'WARGA'];
  const result = roles.map(role => {
    const customPerm = dbFindOne('permissions', { role });
    let permissions;
    
    if (customPerm && customPerm.permissions) {
      try {
        permissions = JSON.parse(customPerm.permissions);
      } catch (e) {
        permissions = getDefaultPermissions(role);
      }
    } else {
      permissions = getDefaultPermissions(role);
    }
    
    return { role, permissions };
  });
  
  return { ok: true, data: result };
}

function roleJabatanList() {
  const settings = getPublicSettings();
  
  // Return dynamic config or fallback to hardcoded
  if (settings.jabatanConfig) {
    const perBlok = settings.jabatanConfig.perBlok || [];
    const bersama = settings.jabatanConfig.bersama || [];
    
    // Build maps for backward compatibility
    const jabatanPerBlok = {};
    const jabatanBersama = {};
    const allJabatan = {};
    
    for (const j of perBlok) {
      jabatanPerBlok[j.key] = { label: j.label, order: j.order, scope: j.scope };
      allJabatan[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
    for (const j of bersama) {
      jabatanBersama[j.key] = { label: j.label, order: j.order, scope: j.scope };
      allJabatan[j.key] = { label: j.label, order: j.order, scope: j.scope };
    }
    
    return { 
      ok: true, 
      data: { 
        jabatanPerBlok, 
        jabatanBersama, 
        allJabatan,
        jabatanConfig: settings.jabatanConfig,
        kontakRTA: settings.kontakRTA || null,
        kontakRTB: settings.kontakRTB || null,
      } 
    };
  }
  
  // Fallback to hardcoded
  return { 
    ok: true, 
    data: { 
      jabatanPerBlok: JABATAN_PER_BLOK, 
      jabatanBersama: JABATAN_BERSAMA, 
      allJabatan: ALL_JABATAN,
      jabatanConfig: null,
      kontakRTA: null,
      kontakRTB: null,
    } 
  };
}

function roleUpdatePermissions(user, { role, permissions }) {
  const permCheck = requirePermission(user, 'canManageRoles');
  if (permCheck) return permCheck;
  
  const validRoles = ['ADMIN', 'BENDAHARA', 'WARGA'];
  if (!validRoles.includes(role)) {
    return { ok: false, error: 'Tidak dapat mengubah permission role ini' };
  }
  
  const storedValue = JSON.stringify(permissions);
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    
    const existing = dbFindOne('permissions', { role });
    if (existing) {
      dbUpdate('permissions', existing.id, { permissions: storedValue });
    } else {
      const sheet = getSheet('permissions');
      sheet.appendRow([role, storedValue]);
    }
  } finally {
    lock.releaseLock();
  }
  
  return { ok: true, data: { message: `Permission untuk role ${role} berhasil diperbarui` } };
}

// ==================== FILE UPLOAD ====================
// Folder categories for organized file storage
const FOLDER_CATEGORIES = {
  'profile_photos': { name: 'Foto Profil', description: 'Foto profil warga dan pengurus' },
  'payment_proofs': { name: 'Bukti Pembayaran', description: 'Bukti transfer pembayaran iuran' },
  'gallery': { name: 'Galeri Kegiatan', description: 'Dokumentasi foto kegiatan' },
  'logo_banner': { name: 'Logo & Banner', description: 'Logo dan banner aplikasi' },
  'documents': { name: 'Dokumen', description: 'Dokumen dan file lainnya' },
};

/**
 * Get or create a subfolder within the main drive folder
 * Automatically sets public sharing permission
 * @param {string} category - Folder category (profile_photos, payment_proofs, gallery, logo_banner, documents)
 * @returns {GoogleAppsScript.Drive.Folder} - The folder object
 */
function getOrCreateSubfolder(category) {
  const mainFolder = DriveApp.getFolderById(CONFIG.DRIVEFOLDERID);
  
  // Default to 'documents' if category not found
  const folderName = FOLDER_CATEGORIES[category]?.name || category || 'Dokumen';
  
  // Check if subfolder exists
  const subfolders = mainFolder.getFoldersByName(folderName);
  
  if (subfolders.hasNext()) {
    const folder = subfolders.next();
    // Ensure public sharing is set
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // Folder might already have the correct sharing settings
    }
    return folder;
  }
  
  // Create new subfolder
  const newFolder = mainFolder.createFolder(folderName);
  
  // Set public sharing for the folder
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  logInfo('fileUpload', `Created new folder: ${folderName}`, { category }, null);
  
  return newFolder;
}

/**
 * Setup all folder categories - Run once to create folder structure
 * Can be run manually from Apps Script editor
 */
function setupDriveFolders() {
  const mainFolder = DriveApp.getFolderById(CONFIG.DRIVEFOLDERID);
  
  // Set main folder to public
  try {
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.log('Main folder sharing already set');
  }
  
  // Create all category folders
  for (const [key, info] of Object.entries(FOLDER_CATEGORIES)) {
    const folder = getOrCreateSubfolder(key);
    console.log(`Created/verified folder: ${info.name} - ${info.description}`);
  }
  
  return { 
    ok: true, 
    message: 'All folder categories created and shared publicly',
    folders: Object.keys(FOLDER_CATEGORIES).map(k => FOLDER_CATEGORIES[k].name)
  };
}

/**
 * Upload file to appropriate folder based on category
 * @param {Object} user - Current user (can be null for public uploads)
 * @param {Object} payload - { fileName, mimeType, base64, category }
 * @returns {Object} - { ok, data: { url, fileName, folder } } or { ok: false, error }
 */
function fileUpload(user, { fileName, mimeType, base64, category }) {
  if (!fileName || !mimeType || !base64) {
    return { ok: false, error: 'Data file tidak lengkap' };
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
  ];
  
  if (!allowedTypes.includes(mimeType)) {
    return { ok: false, error: 'Tipe file tidak diizinkan. Format yang didukung: JPG, PNG, GIF, WEBP, PDF' };
  }
  
  const maxSizeMB = 2;
  const estimatedSize = (base64.length * 0.75) / (1024 * 1024);
  
  if (estimatedSize > maxSizeMB) {
    return { ok: false, error: `Ukuran file maksimal ${maxSizeMB}MB` };
  }
  
  // Default category is 'documents'
  const fileCategory = category || 'documents';
  
  try {
    // Get appropriate folder based on category
    const folder = getOrCreateSubfolder(fileCategory);
    
    // Create file
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    const file = folder.createFile(blob);
    
    // Set public sharing for the file
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const userId = user?.id || null;
    logInfo('fileUpload', 'File uploaded successfully', { 
      fileName: file.getName(), 
      category: fileCategory,
      size: estimatedSize.toFixed(2) + 'MB'
    }, userId);
    
    return {
      ok: true,
      data: {
        url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
        fileName: file.getName(),
        folder: folder.getName(),
        category: fileCategory,
        fileId: file.getId(),
      },
    };
  } catch (e) {
    const userId = user?.id || null;
    logError('fileUpload', 'File upload failed', { fileName, category: fileCategory }, e.message, userId);
    console.error('File upload error:', e);
    return { ok: false, error: 'Gagal mengupload file: ' + e.message };
  }
}

/**
 * List all files in a specific category folder
 * @param {string} category - Folder category
 * @returns {Object} - List of files with URLs
 */
function listFilesByCategory(category) {
  try {
    const folder = getOrCreateSubfolder(category);
    const files = folder.getFiles();
    const fileList = [];
    
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
        createdTime: file.getDateCreated().toISOString(),
        size: file.getSize(),
      });
    }
    
    return { ok: true, data: fileList };
  } catch (e) {
    return { ok: false, error: 'Gagal mengambil daftar file' };
  }
}

// ==================== SETUP FUNCTIONS ====================

/**
 * Update transactions sheet dengan kolom paymentId
 * Run sekali setelah update code.gs
 */
function updateTransactionsSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETID);
  let sheet = ss.getSheetByName('transactions');
  
  if (!sheet) {
    sheet = ss.insertSheet('transactions');
    const headers = SCHEMAS.transactions;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    Logger.log('Created new transactions sheet with paymentId column');
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!headers.includes('paymentId')) {
    const dateIdx = headers.indexOf('date');
    if (dateIdx >= 0) {
      sheet.insertColumnAt(dateIdx + 2);
      sheet.getRange(1, dateIdx + 2).setValue('paymentId');
      Logger.log('Added paymentId column to transactions sheet');
    }
  } else {
    Logger.log('paymentId column already exists');
  }
}

/**
 * Initial Setup - Run sekali untuk inisialisasi awal
 * Membuat semua sheets, admin default, dan settings default
 */
function initialSetup() {
  // Create all sheets
  Object.keys(SCHEMAS).forEach(getSheet);
  
  // Create default admin if not exists
  const existingAdmin = dbFindOne('users', { email: 'admin@iwkrt11.local' });
  
  if (!existingAdmin) {
    dbInsert('users', {
      nama: 'Super Admin',
      email: 'admin@iwkrt11.local',
      passwordHash: hashPassword('admin123'),
      nik: '0000000000000000',
      telepon: '081234567890',
      blok: 'A',
      nomorRumah: '001',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      photoUrl: '',
    });
    Logger.log('Default admin created: admin@iwkrt11.local / admin123');
  }
  
  // Initialize default settings
  const defaultSettings = [
    ['appName', 'Pradha-Ciganitri Portal'],
    ['rtName', 'RT 011'],
    ['rwName', 'RW 005'],
    ['address', 'Perumahan Indah Warga Kita'],
    ['monthlyFee', '50000'],
    ['tarifIuran', '50000'],
    ['bankInfoA', JSON.stringify({ bankName: 'BCA', bankAccount: '1234567890', bankHolder: 'RT Pradha Ciganitri Blok A' })],
    ['bankInfoB', JSON.stringify({ bankName: 'Mandiri', bankAccount: '0987654321', bankHolder: 'RT Pradha Ciganitri Blok B' })],
    ['enableRegistration', 'true'],
    ['enablePaymentSubmission', 'true'],
    ['enableAgenda', 'true'],
    ['enableGallery', 'true'],
    ['enableInformation', 'true'],
    ['enablePublicFinance', 'true'],
    ['enableReviews', 'true'],
    ['primaryColor', '#2563eb'],
    ['googleMapsEmbedUrl', ''],
    ['socialMediaLinks', '[]'],
    ['incomeCategories', '["Iuran Bulanan","Dana Sosial","Lain-lain"]'],
    ['expenseCategories', '["Kebersihan","Keamanan","Perbaikan","Listrik","Kegiatan","Administrasi","Lain-lain"]'],
    ['informationCategories', '["Pengumuman","Berita","Info Penting"]'],
    ['categoriesA', JSON.stringify({ income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'], expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'], information: ['Pengumuman', 'Berita', 'Info Penting'] })],
    ['categoriesB', JSON.stringify({ income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'], expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'], information: ['Pengumuman', 'Berita', 'Info Penting'] })],
  ];
  
  const sheet = getSheet('settings');
  for (const [key, value] of defaultSettings) {
    const existing = dbFindOne('settings', { key });
    if (!existing) {
      sheet.appendRow([key, value]);
    }
  }
  
  Logger.log('Initial setup complete!');
}

// ==================== SEED DUMMY PENGURUS ====================
// Jalankan fungsi ini dari Apps Script Editor untuk memasukkan data dummy pengurus
// Run this function from Apps Script Editor to insert dummy pengurus data
function seedDummyPengurus() {
  const dummyPengurus = [
    // ===== BLOK A =====
    {
      nama: 'Bpk Afip',
      email: 'afip@pradha-ciganitri.local',
      password: 'afip123',
      nik: '3273010101010001',
      telepon: '087364848848',
      blok: 'A',
      nomorRumah: '49',
      role: 'ADMIN',
      jabatan: 'KETUA_RT'
    },
    {
      nama: 'Bpk Dedi',
      email: 'dedi@pradha-ciganitri.local',
      password: 'dedi123',
      nik: '3273010101010002',
      telepon: '081321654987',
      blok: 'A',
      nomorRumah: '25',
      role: 'WARGA',
      jabatan: 'WAKIL_KETUA'
    },
    {
      nama: 'Ibu Siti',
      email: 'siti@pradha-ciganitri.local',
      password: 'siti123',
      nik: '3273010101010003',
      telepon: '085678912345',
      blok: 'A',
      nomorRumah: '12',
      role: 'WARGA',
      jabatan: 'SEKRETARIS'
    },
    {
      nama: 'Bpk Hendra',
      email: 'hendra@pradha-ciganitri.local',
      password: 'hendra123',
      nik: '3273010101010004',
      telepon: '082198765432',
      blok: 'A',
      nomorRumah: '78',
      role: 'BENDAHARA',
      jabatan: 'BENDAHARA'
    },
    
    // ===== BLOK B =====
    {
      nama: 'Bpk Risan',
      email: 'risan@pradha-ciganitri.local',
      password: 'risan123',
      nik: '3273010101010005',
      telepon: '08122495879',
      blok: 'B',
      nomorRumah: '149',
      role: 'ADMIN',
      jabatan: 'KETUA_RT'
    },
    {
      nama: 'Bpk Ahmad',
      email: 'ahmad@pradha-ciganitri.local',
      password: 'ahmad123',
      nik: '3273010101010006',
      telepon: '085712345678',
      blok: 'B',
      nomorRumah: '125',
      role: 'WARGA',
      jabatan: 'WAKIL_KETUA'
    },
    {
      nama: 'Ibu Ratna',
      email: 'ratna@pradha-ciganitri.local',
      password: 'ratna123',
      nik: '3273010101010007',
      telepon: '081234567891',
      blok: 'B',
      nomorRumah: '167',
      role: 'WARGA',
      jabatan: 'SEKRETARIS'
    },
    {
      nama: 'Bpk Yanto',
      email: 'yanto@pradha-ciganitri.local',
      password: 'yanto123',
      nik: '3273010101010008',
      telepon: '087812345678',
      blok: 'B',
      nomorRumah: '180',
      role: 'BENDAHARA',
      jabatan: 'BENDAHARA'
    },
    
    // ===== BERSAMA (SHARED) =====
    {
      nama: 'Bpk Karim',
      email: 'karim@pradha-ciganitri.local',
      password: 'karim123',
      nik: '3273010101010009',
      telepon: '085612345678',
      blok: 'A',
      nomorRumah: '55',
      role: 'WARGA',
      jabatan: 'SIE_KEAMANAN'
    },
    {
      nama: 'Bpk Dani',
      email: 'dani@pradha-ciganitri.local',
      password: 'dani123',
      nik: '3273010101010010',
      telepon: '082112345678',
      blok: 'B',
      nomorRumah: '175',
      role: 'WARGA',
      jabatan: 'SIE_KEBERSIHAN'
    },
    {
      nama: 'Bpk Basir',
      email: 'basir@pradha-ciganitri.local',
      password: 'basir123',
      nik: '3273010101010011',
      telepon: '085220590365',
      blok: 'B',
      nomorRumah: '132',
      role: 'WARGA',
      jabatan: 'DKM_MASJID'
    }
  ];
  
  const results = {
    success: [],
    skipped: [],
    errors: []
  };
  
  for (const pengurus of dummyPengurus) {
    try {
      // Check if email already exists
      const existingEmail = dbFindOne('users', { email: pengurus.email.toLowerCase() });
      if (existingEmail) {
        results.skipped.push({ nama: pengurus.nama, email: pengurus.email, reason: 'Email sudah terdaftar' });
        continue;
      }
      
      // Check if NIK already exists
      const existingNik = dbFindOne('users', { nik: pengurus.nik });
      if (existingNik) {
        results.skipped.push({ nama: pengurus.nama, nik: pengurus.nik, reason: 'NIK sudah terdaftar' });
        continue;
      }
      
      // Insert new pengurus
      dbInsert('users', {
        nama: pengurus.nama,
        email: pengurus.email.toLowerCase(),
        passwordHash: hashPassword(pengurus.password),
        nik: pengurus.nik,
        telepon: pengurus.telepon,
        blok: pengurus.blok,
        nomorRumah: pengurus.nomorRumah,
        role: pengurus.role,
        status: 'ACTIVE',
        photoUrl: '',
        jabatan: pengurus.jabatan
      });
      
      results.success.push({
        nama: pengurus.nama,
        jabatan: ALL_JABATAN[pengurus.jabatan].label,
        blok: pengurus.blok,
        telepon: pengurus.telepon
      });
      
    } catch (error) {
      results.errors.push({ nama: pengurus.nama, error: error.message });
    }
  }
  
  // Log results
  Logger.log('===== SEED DUMMY PENGURUS RESULTS =====');
  Logger.log(`Berhasil ditambahkan: ${results.success.length}`);
  results.success.forEach(s => Logger.log(`  ✓ ${s.nama} - ${s.jabatan} Blok ${s.blok} (${s.telepon})`));
  
  Logger.log(`Dilewati: ${results.skipped.length}`);
  results.skipped.forEach(s => Logger.log(`  ⊘ ${s.nama} - ${s.reason}`));
  
  Logger.log(`Error: ${results.errors.length}`);
  results.errors.forEach(e => Logger.log(`  ✗ ${e.nama} - ${e.error}`));
  
  return results;
}

// Fungsi untuk menghapus semua dummy pengurus (untuk reset)
function clearDummyPengurus() {
  const dummyEmails = [
    'afip@pradha-ciganitri.local',
    'dedi@pradha-ciganitri.local',
    'siti@pradha-ciganitri.local',
    'hendra@pradha-ciganitri.local',
    'risan@pradha-ciganitri.local',
    'ahmad@pradha-ciganitri.local',
    'ratna@pradha-ciganitri.local',
    'yanto@pradha-ciganitri.local',
    'karim@pradha-ciganitri.local',
    'dani@pradha-ciganitri.local',
    'basir@pradha-ciganitri.local'
  ];
  
  let deleted = 0;
  for (const email of dummyEmails) {
    const user = dbFindOne('users', { email: email.toLowerCase() });
    if (user) {
      dbDelete('users', user.id);
      deleted++;
      Logger.log(`Deleted: ${user.nama} (${email})`);
    }
  }
  
  Logger.log(`Total deleted: ${deleted}`);
  return { deleted };
}
