// ==================== CONFIGURATION ====================
const CONFIG = {
  SPREADSHEETID: 'YOURSPREADSHEETID',
  DRIVEFOLDERID: 'YOURDRIVEFOLDERID',
  JWTSECRET: 'Pr4dh4_c1g4n1tr1_S3cr3t_2026_xYz',
  TOKENEXPIRYDAYS: 7,
};

// ==================== SHEET SCHEMAS (UPDATED v2) ====================
// Updated: Added 'paymentId' to transactions schema for linking payments to income transactions
const SCHEMAS = {
  users: ['id', 'nama', 'email', 'passwordHash', 'nik', 'telepon', 'blok', 'nomorRumah', 'role', 'status', 'photoUrl', 'createdAt', 'updatedAt'],
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
};

// ==================== MAIN ENTRY POINTS ====================
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const { action, token, payload = {} } = req;
    
    // Public actions (no auth required)
    const publicActions = [
      'auth.login', 
      'auth.register', 
      'settings.public',
      'finance.publicSummary',
      'agenda.publicList',
      'info.publicList',
      'pengurus.publicList',
      'review.publicList',
      'gallery.publicList'
    ];
    
    let user = null;
    if (!publicActions.includes(action)) {
      user = validateToken(token);
      if (!user) {
        return respond({ ok: false, error: 'Token invalid atau expired' });
      }
    }
    
    // Check feature toggles for certain actions
    const featureCheck = checkFeatureEnabled(action);
    if (!featureCheck.ok) {
      return respond(featureCheck);
    }
    
    const result = routeAction(action, payload, user);
    return respond(result);
    
  } catch (error) {
    console.error('doPost Error:', error);
    return respond({ ok: false, error: 'Terjadi kesalahan server' });
  }
}

function doGet() {
  return respond({ ok: true, data: { name: 'Pradha-Ciganitri API', version: '5.1.0' } });
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
    'review.publicList': () => reviewPublicList(payload),
    'gallery.publicList': () => galleryPublicList(payload),
    
    // Auth
    'auth.login': () => authLogin(payload),
    'auth.register': () => authRegister(payload),
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
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idIdx = headers.indexOf('id');
  const updatedAtIdx = headers.indexOf('updatedAt');
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idIdx] === id) {
        const rowRange = sheet.getRange(i + 1, 1, 1, headers.length);
        const rowValues = rowRange.getValues()[0];
        
        headers.forEach((h, colIdx) => {
          if (data[h] !== undefined && h !== 'id' && h !== 'createdAt') {
            rowValues[colIdx] = data[h];
          }
        });
        
        if (updatedAtIdx >= 0) {
          rowValues[updatedAtIdx] = new Date().toISOString();
        }
        
        rowRange.setValues([rowValues]);
        break;
      }
    }
  } finally {
    lock.releaseLock();
  }
  
  return dbFindOne(sheetName, { id });
}

function dbDelete(sheetName, id) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idIdx = headers.indexOf('id');
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(4000);
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
  } finally {
    lock.releaseLock();
  }
  
  return false;
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
  
  const pengurus = users.filter(u => 
    u.status === 'ACTIVE' && 
    ['SUPERADMIN', 'ADMIN', 'BENDAHARA'].includes(u.role)
  );
  
  const publicPengurus = pengurus.map(u => ({
    id: u.id,
    nama: u.nama,
    role: u.role,
    blok: u.blok,
    telepon: u.telepon,
    photoUrl: u.photoUrl || '',
  }));
  
  const roleOrder = { 'SUPERADMIN': 0, 'ADMIN': 1, 'BENDAHARA': 2 };
  publicPengurus.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  
  return { ok: true, data: publicPengurus };
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
function fileUpload(user, { fileName, mimeType, base64 }) {
  if (!fileName || !mimeType || !base64) {
    return { ok: false, error: 'Data file tidak lengkap' };
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
  ];
  
  if (!allowedTypes.includes(mimeType)) {
    return { ok: false, error: 'Tipe file tidak diizinkan' };
  }
  
  const maxSizeMB = 2;
  const estimatedSize = (base64.length * 0.75) / (1024 * 1024);
  
  if (estimatedSize > maxSizeMB) {
    return { ok: false, error: `Ukuran file maksimal ${maxSizeMB}MB` };
  }
  
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVEFOLDERID);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    const file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      ok: true,
      data: {
        url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
        fileName: file.getName(),
      },
    };
  } catch (e) {
    console.error('File upload error:', e);
    return { ok: false, error: 'Gagal mengupload file' };
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
