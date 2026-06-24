// ============================================
// BARADHU - COMPLETE APP LOGIC (FIXED)
// ============================================

// Global Variables
let currentLanguage = 'english';
let currentLesson = null;
let currentCardIndex = 0;
let quizScore = 0;
let currentQuizIndex = 0;
let completedLessons = [];
let totalXP = 0;
let currentUser = null;
let confirmCallback = null;

// ============================================
// 1. INITIALIZATION - RUNS ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Baradhu app starting...');
    
    // Check if lessons loaded
    if (typeof MASTER_LESSONS === 'undefined' || MASTER_LESSONS.length === 0) {
        console.error('❌ Lessons not loaded!');
        alert('Error: Lessons not loaded. Please refresh the page.');
        return;
    }
    
    console.log(`✅ Loaded ${MASTER_LESSONS.length} lessons`);
    
    // Load saved data from localStorage
    loadData();
    
    // Setup admin access
    setupAdminAccess();
    
    // Check if user has active session
    const hasStarted = localStorage.getItem('baradhu_started');
    const hasUser = localStorage.getItem('baradhu_current_user');
    
    if (hasStarted && hasUser) {
        // User is logged in - load home screen
        currentUser = getCurrentUser();
        if (currentUser) {
            console.log('✅ User logged in:', currentUser.name);
            showScreen('home-screen');
            initializeHomeScreen();
        } else {
            // User data missing - reset
            console.log('⚠️ User data missing, resetting...');
            localStorage.removeItem('baradhu_started');
            localStorage.removeItem('baradhu_current_user');
            showScreen('language-screen');
        }
    } else {
        // No session - show welcome screen
        console.log('👋 Showing welcome screen');
        showScreen('language-screen');
    }
    
    // Check for admin URL parameter
    if (window.location.search.includes('admin=1')) {
        setTimeout(openAdminPanel, 500);
    }
});

// ============================================
// 2. LOAD SAVED DATA
// ============================================
function loadData() {
    try {
        // Load completed lessons
        const savedLessons = localStorage.getItem('baradhu_completed');
        if (savedLessons) {
            completedLessons = JSON.parse(savedLessons);
        }
        
        // Load XP
        const savedXP = localStorage.getItem('baradhu_xp');
        if (savedXP) {
            totalXP = parseInt(savedXP);
        }
        
        console.log(`📊 Loaded: ${completedLessons.length} lessons, ${totalXP} XP`);
    } catch (e) {
        console.error('❌ Error loading data:', e);
        completedLessons = [];
        totalXP = 0;
    }
}

// ============================================
// 3. SCREEN MANAGEMENT
// ============================================
function showScreen(screenId) {
    console.log(`📺 Showing screen: ${screenId}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        
        // Initialize screen-specific content
        if (screenId === 'home-screen') {
            initializeHomeScreen();
        }
    } else {
        console.error(`❌ Screen not found: ${screenId}`);
    }
}

// ============================================
// 4. START APP (from welcome screen)
// ============================================
function startApp() {
    console.log('🚀 Starting app...');
    
    // Mark app as started
    localStorage.setItem('baradhu_started', 'true');
    
    // Check if user already logged in
    const currentUserData = getCurrentUser();
    
    if (currentUserData) {
        // User already logged in - go to home
        currentUser = currentUserData;
        showScreen('home-screen');
        initializeHomeScreen();
    } else {
        // Show login screen
        showScreen('login-screen');
    }
}

// ============================================
// 5. INITIALIZE HOME SCREEN
// ============================================
function initializeHomeScreen() {
    console.log('🏠 Initializing home screen');
    
    // Update user UI
    updateUserUI();
    
    // Update XP display
    updateXPDisplay();
    
    // Render lessons grid
    renderLessonsGrid();
    
    // Update progress
    updateProgressUI();
    
    // Render premium banner
    renderPremiumBanner();
}

// ============================================
// 6. USER AUTHENTICATION
// ============================================

// Show Register Screen
function showRegisterScreen() {
    showScreen('register-screen');
    // Clear form
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    const termsCheckbox = document.getElementById('reg-terms');
    if (termsCheckbox) termsCheckbox.checked = false;
}

// Register New User
function registerUser() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const terms = document.getElementById('reg-terms') ? document.getElementById('reg-terms').checked : true;
    
    // Validation
    if (!name || name.length < 2) {
        showToast('⚠️ Maqaa sirrii galchi!');
        return;
    }
    
    if (!phone || !/^09\d{8}$/.test(phone)) {
        showToast('⚠️ Lakkoofsa bilbilaa sirrii galchi (09XXXXXXXX)!');
        return;
    }
    
    if (!terms) {
        showToast('⚠️ Haala tajaajilaa fudhuu qabda!');
        return;
    }
    
    // Check if phone already registered
    const existingUser = findUserByPhone(phone);
    if (existingUser) {
        showToast('⚠️ Lakkoofsi kanaan dura galmaa\'eera. Seeni.');
        setTimeout(() => {
            document.getElementById('login-phone').value = phone;
            showScreen('login-screen');
        }, 1500);
        return;
    }
    
    // Create new user
    const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        phone: phone,
        registeredAt: new Date().toISOString(),
        code: null,
        codeGeneratedAt: null,
        isActivated: false,
        activatedAt: null,
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null
    };
    
    // Save user
    const users = loadUsers();
    users.push(newUser);
    saveUsers(users);
    
    // Set as current user
    setCurrentUser(newUser.id);
    currentUser = newUser;
    
    console.log('✅ User registered:', newUser.name);
    showToast('✅ Galmeen kee milkaa\'eera!');
    
    // Go to home screen
    showScreen('home-screen');
    initializeHomeScreen();
}

// Show Login Screen
function showLoginScreen() {
    showScreen('login-screen');
    document.getElementById('login-phone').value = '';
}

// Login User
function loginUser() {
    const phone = document.getElementById('login-phone').value.trim();
    
    if (!phone || !/^09\d{8}$/.test(phone)) {
        showToast('⚠️ Lakkoofsa bilbilaa sirrii galchi!');
        return;
    }
    
    const user = findUserByPhone(phone);
    
    if (!user) {
        showToast('❌ Lakkoofsi kanaan hin galmoofne. Galmeessi.');
        setTimeout(() => {
            document.getElementById('reg-phone').value = phone;
            showScreen('register-screen');
        }, 1500);
        return;
    }
    
    // Login successful
    setCurrentUser(user.id);
    currentUser = user;
    
    console.log('✅ User logged in:', user.name);
    showToast(`✅ Baga nagaan dhuftan, ${user.name}!`);
    
    // Go to home screen
    showScreen('home-screen');
    initializeHomeScreen();
}

// Logout User
function logoutUser() {
    showConfirm(
        'Ba\'uu barbaadda?',
        'Herrega kee keessaa baha. Irra deebi\'uuf odeeffannoo kee galchuu qabda.',
        '👋',
        function() {
            // Clear session
            localStorage.removeItem('baradhu_started');
            localStorage.removeItem('baradhu_current_user');
            currentUser = null;
            
            console.log('👋 User logged out');
            showToast('👋 Nagaatti!');
            
            // Go to welcome screen
            showScreen('language-screen');
        }
    );
}

// ============================================
// 7. USER UI UPDATES
// ============================================
function updateUserUI() {
    if (!currentUser) {
        console.log('⚠️ No current user to update UI');
        return;
    }
    
    console.log('🔄 Updating user UI for:', currentUser.name);
    
    // Update header
    const avatar = document.getElementById('user-avatar');
    const greeting = document.getElementById('user-greeting');
    const userName = document.getElementById('user-name');
    
    if (avatar) {
        avatar.innerText = currentUser.name.charAt(0).toUpperCase();
    }
    
    if (greeting) {
        const firstName = currentUser.name.split(' ')[0];
        greeting.innerText = `Akkam, ${firstName}!`;
    }
    
    if (userName) {
        userName.innerText = 'Barataa';
    }
    
    // Update user menu
    const menuAvatar = document.getElementById('menu-avatar');
    const menuName = document.getElementById('menu-user-name');
    const menuPhone = document.getElementById('menu-user-phone');
    const menuXP = document.getElementById('menu-xp');
    const menuLessons = document.getElementById('menu-lessons');
    
    if (menuAvatar) menuAvatar.innerText = currentUser.name.charAt(0).toUpperCase();
    if (menuName) menuName.innerText = currentUser.name;
    if (menuPhone) menuPhone.innerText = currentUser.phone;
    if (menuXP) menuXP.innerText = totalXP + ' XP';
    if (menuLessons) menuLessons.innerText = completedLessons.length + ' Barnoota';
}

function updateXPDisplay() {
    const xpElement = document.getElementById('total-xp');
    if (xpElement) {
        xpElement.innerText = totalXP;
    }
}

// ============================================
// 8. HOME SCREEN RENDERING
// ============================================
function renderLessonsGrid() {
    const grid = document.getElementById('lessons-grid');
    if (!grid) {
        console.error('❌ Lessons grid not found');
        return;
    }
    
    console.log('📚 Rendering lessons grid');
    grid.innerHTML = '';
    
    const hasPremium = localStorage.getItem('baradhu_premium') === 'true';
    
    MASTER_LESSONS.forEach(lesson => {
        const isCompleted = completedLessons.includes(lesson.id);
        const isLocked = lesson.isPremium && !hasPremium;
        
        const card = document.createElement('div');
        let cardClass = 'lesson-card';
        
        if (isCompleted) cardClass += ' completed';
        if (lesson.isPremium && !isLocked) cardClass += ' unlocked';
        if (isLocked) cardClass += ' premium';
        
        card.className = cardClass;
        
        card.onclick = () => {
            if (isLocked) {
                openPremiumModal();
            } else {
                startLesson(lesson.id);
            }
        };
        
        let statusIcon = '';
        if (isCompleted) statusIcon = '<i class="fas fa-check-circle"></i>';
        else if (isLocked) statusIcon = '<i class="fas fa-lock"></i>';
        else if (lesson.isPremium) statusIcon = '<i class="fas fa-crown"></i>';
        
        let badges = '';
        if (lesson.isPremium && !isLocked) {
            badges += '<div class="premium-tag"><i class="fas fa-crown"></i> UNLOCKED</div>';
        }
        if (isLocked) {
            badges += '<div class="lock-badge"><i class="fas fa-lock"></i> PREMIUM</div>';
        }
        
        card.innerHTML = `
            ${badges}
            <div class="lesson-number">${lesson.id}</div>
            <div class="lesson-icon">${lesson.icon || '📚'}</div>
            <div class="lesson-title">${lesson.title}</div>
            <div class="lesson-words">${lesson.words.length} jecha</div>
            <div class="lesson-status">${statusIcon}</div>
        `;
        
        grid.appendChild(card);
    });
}

function updateProgressUI() {
    const total = MASTER_LESSONS.length;
    const completed = completedLessons.length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const progressRing = document.getElementById('progress-ring-fill');
    
    if (progressText) progressText.innerText = `${completed} / ${total} Barnoota`;
    if (progressPercent) progressPercent.innerText = `${Math.round(percent)}%`;
    
    if (progressRing) {
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (percent / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

function renderPremiumBanner() {
    const container = document.getElementById('premium-banner-container');
    if (!container) return;
    
    const hasPremium = localStorage.getItem('baradhu_premium') === 'true';
    
    if (!hasPremium) {
        container.innerHTML = `
            <div class="premium-banner" onclick="openPremiumModal()">
                <div class="banner-content">
                    <div class="banner-icon">💎</div>
                    <div class="banner-info">
                        <h3>Barnoota Premium Bani</h3>
                        <p>Barnoota 12 fi jecha 1000+ argadhu</p>
                    </div>
                    <button class="banner-btn">Bani <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

// ============================================
// 9. LESSON & QUIZ FUNCTIONS
// ============================================
function startLesson(lessonId) {
    currentLesson = MASTER_LESSONS.find(l => l.id === lessonId);
    if (!currentLesson) {
        console.error('❌ Lesson not found:', lessonId);
        return;
    }
    
    currentCardIndex = 0;
    showScreen('learn-screen');
    renderCard();
    renderProgressDots();
}

function renderCard() {
    const word = currentLesson.words[currentCardIndex];
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    
    document.getElementById('front-lang-label').innerText = 'Afaan Ingilizii';
    document.getElementById('word-primary').innerText = word.english;
    document.getElementById('back-lang-label').innerText = 'Afaan Oromo';
    document.getElementById('word-secondary').innerText = word.oromo;
    document.getElementById('word-example').innerText = `"${word.example1 || word.example}"`;
    document.getElementById('word-example-om').innerText = `→ "${word.exampleOromo1 || word.exampleOromo}"`;
    document.getElementById('word-explanation').innerText = word.explanation;
    
    document.getElementById('lesson-counter').innerText = `${currentCardIndex + 1}/${currentLesson.words.length}`;
    
    const nextBtn = document.getElementById('next-btn');
    if (currentCardIndex === currentLesson.words.length - 1) {
        nextBtn.innerHTML = 'Qormaata <i class="fas fa-brain"></i>';
    } else {
        nextBtn.innerHTML = 'Itti Aanu <i class="fas fa-chevron-right"></i>';
    }
    
    updateProgressDots();
}

function flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function previousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCard();
    }
}

function nextCard() {
    if (currentCardIndex < currentLesson.words.length - 1) {
        currentCardIndex++;
        renderCard();
    } else {
        startQuiz();
    }
}

function renderProgressDots() {
    const container = document.getElementById('lesson-progress-dots');
    if (!container) return;
    
    container.innerHTML = '';
    const maxDots = Math.min(currentLesson.words.length, 10);
    
    for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot' + (i === currentCardIndex ? ' active' : '');
        container.appendChild(dot);
    }
}

function updateProgressDots() {
    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
        dot.className = 'progress-dot' + (i === currentCardIndex ? ' active' : '');
    });
}

function startQuiz() {
    quizScore = 0;
    currentQuizIndex = 0;
    showScreen('quiz-screen');
    renderQuestion();
}

function renderQuestion() {
    const word = currentLesson.words[currentQuizIndex];
    document.getElementById('quiz-word').innerText = word.english;
    document.getElementById('quiz-current-score').innerText = quizScore;
    document.getElementById('quiz-progress').style.width = `${(currentQuizIndex / currentLesson.words.length) * 100}%`;
    
    const container = document.getElementById('quiz-options');
    container.innerHTML = '';
    document.getElementById('quiz-next-btn').classList.add('hidden');
    
    const options = generateOptions(word.oromo);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, word.oromo);
        container.appendChild(btn);
    });
}

function generateOptions(correctAnswer) {
    const allWords = MASTER_LESSONS.flatMap(l => l.words);
    let options = [correctAnswer];
    const available = [...new Set(allWords.map(w => w.oromo).filter(w => w && w !== correctAnswer))];
    
    while (options.length < 4 && available.length > 0) {
        const idx = Math.floor(Math.random() * available.length);
        if (!options.includes(available[idx])) options.push(available[idx]);
        available.splice(idx, 1);
    }
    
    while (options.length < 4) options.push('Hin beekamu');
    return options.sort(() => Math.random() - 0.5);
}

function checkAnswer(btn, selected, correct) {
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.innerText === correct) opt.classList.add('correct');
    });
    
    if (selected === correct) quizScore++;
    else btn.classList.add('wrong');
    
    document.getElementById('quiz-next-btn').classList.remove('hidden');
}

function nextQuestion() {
    if (currentQuizIndex < currentLesson.words.length - 1) {
        currentQuizIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const total = currentLesson.words.length;
    const passed = quizScore >= (total * 0.6);
    const percentage = Math.round((quizScore / total) * 100);
    const xpGained = passed ? (percentage >= 90 ? 100 : percentage >= 75 ? 75 : 50) : 0;
    
    if (passed && !completedLessons.includes(currentLesson.id)) {
        completedLessons.push(currentLesson.id);
        totalXP += xpGained;
        localStorage.setItem('baradhu_completed', JSON.stringify(completedLessons));
        localStorage.setItem('baradhu_xp', totalXP);
    }
    
    const stars = passed ? (percentage >= 90 ? 3 : percentage >= 75 ? 2 : 1) : 0;
    
    document.getElementById('result-emoji').innerText = passed ? '🏆' : '📚';
    document.getElementById('result-title').innerText = passed ? 'Baga Gammaddan!' : "Irra Deebi'i!";
    document.getElementById('score-percentage').innerText = `${percentage}%`;
    document.getElementById('score-detail').innerText = `${quizScore}/${total} sirrii`;
    document.getElementById('xp-gained').innerText = xpGained;
    
    const circle = document.getElementById('score-circle');
    circle.className = 'score-circle';
    if (passed) {
        if (percentage >= 90) circle.classList.add('perfect');
        else if (percentage >= 75) circle.classList.add('great');
        else circle.classList.add('good');
    } else {
        circle.classList.add('failed');
    }
    
    document.querySelectorAll('.stars-rating i').forEach((star, i) => {
        star.className = i < stars ? 'fas fa-star active' : 'far fa-star';
    });
    
    let msg = '';
    if (passed) {
        if (percentage === 100) msg = '🎉 Qabxii guutuu! Ajaa\'ibaa!';
        else if (percentage >= 90) msg = '🌟 Baay\'ee gaarii!';
        else if (percentage >= 75) msg = '👍 Hojii gaarii!';
        else msg = '✅ Hojii gaarii! Darbite!';
    } else {
        msg = `60% barbaachisa. Qabxiin kee ${percentage}%. Irra deebi'i!`;
    }
    document.getElementById('result-message').innerText = msg;
    
    document.getElementById('retry-btn').classList.toggle('hidden', passed);
    
    const nextBtn = document.getElementById('next-lesson-btn');
    if (passed) {
        const next = MASTER_LESSONS.find(l => l.id === currentLesson.id + 1);
        const hasPremium = localStorage.getItem('baradhu_premium') === 'true';
        if (next && (!next.isPremium || hasPremium)) {
            nextBtn.classList.remove('hidden');
            nextBtn.innerHTML = `Barnoota ${next.id}: ${next.title} <i class="fas fa-arrow-right"></i>`;
        } else {
            nextBtn.classList.add('hidden');
        }
    } else {
        nextBtn.classList.add('hidden');
    }
    
    showScreen('result-screen');
    createConfetti(passed);
}

function createConfetti(show) {
    const container = document.getElementById('confetti');
    container.innerHTML = '';
    if (!show) return;
    
    for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${['#FFD700', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0'][Math.floor(Math.random()*5)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: 50%;
            animation: fall ${Math.random() * 2 + 2}s linear;
        `;
        container.appendChild(conf);
    }
    
    setTimeout(() => container.innerHTML = '', 5000);
}

function retryLesson() {
    startLesson(currentLesson.id);
}

function goToNextLesson() {
    const next = MASTER_LESSONS.find(l => l.id === currentLesson.id + 1);
    if (next) startLesson(next.id);
    else showScreen('home-screen');
}

// ============================================
// 10. PREMIUM MODAL FUNCTIONS
// ============================================
function openPremiumModal() {
    if (!currentUser) {
        showScreen('login-screen');
        return;
    }
    
    // Refresh user data
    currentUser = findUserById(currentUser.id);
    
    document.getElementById('premium-modal').classList.remove('hidden');
    document.getElementById('activation-error').classList.add('hidden');
    
    const codeInput = document.getElementById('activation-code-input');
    if (codeInput) codeInput.value = '';
    
    updateAttemptsDisplay();
}

function closePremiumModal() {
    document.getElementById('premium-modal').classList.add('hidden');
}

function updateAttemptsDisplay() {
    if (!currentUser) return;
    
    const attemptsInfo = document.getElementById('attempts-info');
    const attemptsText = document.getElementById('attempts-text');
    const maxAttempts = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.maxFailedAttempts : 3;
    const remaining = maxAttempts - (currentUser.failedAttempts || 0);
    
    if (attemptsText) {
        attemptsText.innerHTML = `Yaalii hafe: <strong>${remaining}</strong>`;
    }
    
    if (attemptsInfo) {
        attemptsInfo.classList.toggle('danger', remaining <= 1);
    }
}

function verifyActivationCode() {
    if (!currentUser) return;
    
    currentUser = findUserById(currentUser.id);
    
    const input = document.getElementById('activation-code-input');
    const enteredCode = input.value.trim().toUpperCase();
    
    if (!enteredCode) {
        showActivationError('⚠️ Maaloo koodii galchi!');
        return;
    }
    
    const codeEntry = findCodeByValue(enteredCode);
    
    if (!codeEntry) {
        handleFailedAttempt('Kodiin kun hin jiru.');
        return;
    }
    
    if (codeEntry.assignedTo !== currentUser.id) {
        handleFailedAttempt('Kodiin kun kan nama biraati.');
        return;
    }
    
    if (codeEntry.used) {
        handleFailedAttempt('Kodiin kun dura fayyadameera.');
        return;
    }
    
    // Success!
    codeEntry.used = true;
    codeEntry.usedAt = new Date().toISOString();
    const codes = loadCodes();
    const idx = codes.findIndex(c => c.code === codeEntry.code);
    if (idx !== -1) codes[idx] = codeEntry;
    saveCodes(codes);
    
    updateUser(currentUser.id, {
        isActivated: true,
        activatedAt: new Date().toISOString(),
        failedAttempts: 0
    });
    
    localStorage.setItem('baradhu_premium', 'true');
    
    closePremiumModal();
    showToast('🎉 Premium banameera!');
    
    // Refresh home screen
    initializeHomeScreen();
}

function handleFailedAttempt(errorMessage) {
    const maxAttempts = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.maxFailedAttempts : 3;
    const newAttempts = (currentUser.failedAttempts || 0) + 1;
    
    const updates = {
        failedAttempts: newAttempts,
        lastAttemptAt: new Date().toISOString()
    };
    
    if (newAttempts >= maxAttempts) {
        const lockUntil = new Date();
        const lockHours = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.lockDurationHours : 24;
        lockUntil.setHours(lockUntil.getHours() + lockHours);
        updates.isLocked = true;
        updates.lockedUntil = lockUntil.toISOString();
        
        updateUser(currentUser.id, updates);
        currentUser = findUserById(currentUser.id);
        
        showActivationError(`🔒 Herregni kee sa'aatii ${lockHours}f cufameera!`);
        return;
    }
    
    updateUser(currentUser.id, updates);
    currentUser = findUserById(currentUser.id);
    
    const remaining = maxAttempts - newAttempts;
    showActivationError(`${errorMessage} (Yaalii hafe: ${remaining})`);
}

function showActivationError(message) {
    const errorEl = document.getElementById('activation-error');
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.innerText = message;
    if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.style.animation = 'none';
        setTimeout(() => errorEl.style.animation = 'shake 0.5s', 10);
    }
}

// ============================================
// 11. USER MENU
// ============================================
function showUserMenu() {
    if (!currentUser) return;
    
    // Update menu content
    updateUserUI();
    
    document.getElementById('user-menu-modal').classList.remove('hidden');
}

function closeUserMenu() {
    document.getElementById('user-menu-modal').classList.add('hidden');
}

// ============================================
// 12. CONFIRM MODAL
// ============================================
function showConfirm(title, message, icon, callback) {
    document.getElementById('confirm-icon').innerText = icon;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    confirmCallback = callback;
    
    const okBtn = document.getElementById('confirm-ok-btn');
    okBtn.onclick = () => {
        closeConfirmModal();
        if (confirmCallback) confirmCallback();
    };
    
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
}

// ============================================
// 13. ADMIN PANEL
// ============================================
let adminTapCount = 0;
let adminTapTimer = null;

function setupAdminAccess() {
    const title = document.getElementById('app-title');
    if (title) {
        title.addEventListener('click', () => {
            adminTapCount++;
            clearTimeout(adminTapTimer);
            adminTapTimer = setTimeout(() => adminTapCount = 0, 2000);
            
            if (adminTapCount >= 5) {
                adminTapCount = 0;
                openAdminPanel();
            }
        });
    }
}

function openAdminPanel() {
    const password = prompt('🔐 Admin Password:');
    if (password !== 'jabaa2026') {
        if (password !== null) alert('❌ Password sirrii miti!');
        return;
    }
    
    document.getElementById('admin-panel').classList.remove('hidden');
    renderAdminDashboard();
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
}

function renderAdminDashboard() {
    const users = loadUsers();
    
    // Stats will be updated here
    console.log('📊 Admin dashboard loaded with', users.length, 'users');
}

// ============================================
// 14. UTILITY FUNCTIONS
// ============================================
function showToast(msg) {
    console.log('💬', msg);
    
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:25px;font-size:14px;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
    toast.innerText = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ============================================
// DEBUG: Log when app is ready
// ============================================
console.log('📝 app.js loaded successfully');
console.log('🔧 All functions defined and ready');
