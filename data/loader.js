// ============================================
// BARADHU - LESSON LOADER
// ============================================

const MASTER_LESSONS = [];

if (typeof LESSON_1 !== 'undefined') MASTER_LESSONS.push(LESSON_1);
if (typeof LESSON_2 !== 'undefined') MASTER_LESSONS.push(LESSON_2);
if (typeof LESSON_3 !== 'undefined') MASTER_LESSONS.push(LESSON_3);
if (typeof LESSON_4 !== 'undefined') MASTER_LESSONS.push(LESSON_4);
if (typeof LESSON_5 !== 'undefined') MASTER_LESSONS.push(LESSON_5);
if (typeof LESSON_6 !== 'undefined') MASTER_LESSONS.push(LESSON_6);
if (typeof LESSON_7 !== 'undefined') MASTER_LESSONS.push(LESSON_7);
if (typeof LESSON_8 !== 'undefined') MASTER_LESSONS.push(LESSON_8);
if (typeof LESSON_9 !== 'undefined') MASTER_LESSONS.push(LESSON_9);
if (typeof LESSON_10 !== 'undefined') MASTER_LESSONS.push(LESSON_10);
if (typeof LESSON_11 !== 'undefined') MASTER_LESSONS.push(LESSON_11);
if (typeof LESSON_12 !== 'undefined') MASTER_LESSONS.push(LESSON_12);

// ============================================
// PREMIUM CONFIG
// ============================================

const PREMIUM_CONFIG = {
    freeLessons: [1, 2, 3, 4, 5],
    premiumPrice: "150 ETB",
    telegram: "@jabaa1",
    telegramLink: "https://t.me/jabaa1",
    maxFailedAttempts: 3,
    lockDurationHours: 24,
    codeExpirationDays: 7,
    telebirr: {
        name: "Telebirr",
        accountName: "YAIKOB TESGERA",
        number: "0917345202",
        icon: "📱"
    },
    awashBank: {
        name: "Awash Bank",
        accountName: "YAIKOB TESGERA",
        accountNumber: "013201771325500",
        branch: "Addis Ababa",
        icon: "🏦"
    }
};

// Mark lessons as premium
MASTER_LESSONS.forEach(lesson => {
    lesson.isPremium = !PREMIUM_CONFIG.freeLessons.includes(lesson.id);
});

// ============================================
// USER MANAGEMENT
// ============================================

function loadUsers() {
    try {
        const saved = localStorage.getItem('baradhu_users');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
}

function saveUsers(users) {
    localStorage.setItem('baradhu_users', JSON.stringify(users));
}

function findUserByPhone(phone) {
    return loadUsers().find(u => u.phone === phone);
}

function findUserById(userId) {
    return loadUsers().find(u => u.id === userId);
}

function getCurrentUser() {
    try {
        const userId = localStorage.getItem('baradhu_current_user');
        if (!userId) return null;
        return findUserById(userId);
    } catch (e) {
        return null;
    }
}

function setCurrentUser(userId) {
    if (userId) {
        localStorage.setItem('baradhu_current_user', userId);
    } else {
        localStorage.removeItem('baradhu_current_user');
    }
}

function updateUser(userId, updates) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        saveUsers(users);
        return users[idx];
    }
    return null;
}

// ============================================
// ACTIVATION CODES
// ============================================

function loadCodes() {
    try {
        const saved = localStorage.getItem('baradhu_codes');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
}

function saveCodes(codes) {
    localStorage.setItem('baradhu_codes', JSON.stringify(codes));
}

function findCodeByValue(codeValue) {
    return loadCodes().find(c => c.code.toUpperCase() === codeValue.toUpperCase());
}

// ============================================
// LOG
// ============================================

console.log(`✅ Loaded ${MASTER_LESSONS.length} lessons`);
console.log(`🆓 Free: ${PREMIUM_CONFIG.freeLessons.length} | 💎 Premium: ${MASTER_LESSONS.length - PREMIUM_CONFIG.freeLessons.length}`);