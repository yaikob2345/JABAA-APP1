// ============================================
// BARADHU - COMPLETE APP LOGIC
// ============================================

// Global variables
let currentLanguage = 'english';
let currentLesson = null;
let currentCardIndex = 0;
let quizScore = 0;
let currentQuizIndex = 0;
let completedLessons = [];
let totalXP = 0;
let currentUser = null;
let confirmCallback = null;

// Load saved data
try {
    completedLessons = JSON.parse(localStorage.getItem('baradhu_completed')) || [];
    totalXP = parseInt(localStorage.getItem('baradhu_xp')) || 0;
} catch (e) {
    completedLessons = [];
    totalXP = 0;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!MASTER_LESSONS || MASTER_LESSONS.length === 0) {
        console.error('Lessons not loaded!');
        return;
    }
    
    console.log('✅ Baradhu app initialized');
    console.log('📚 Lessons loaded:', MASTER_LESSONS.length);
    
    // Check if user has active session
    const hasSession = localStorage.getItem('baradhu_started');
    
    if (hasSession) {
        // Try to load user
        currentUser = getCurrentUser();
        
        if (!currentUser) {
            // User data missing - force logout
            console.log('⚠️ User data missing, clearing session');
            localStorage.removeItem('baradhu_started');
            localStorage.removeItem('baradhu_current_user');
            showScreen('language-screen');
            return;
        }
        
        // User exists - go to home
        showScreen('home-screen');
        updateUserUI();
        renderLessonsGrid();
        updateProgressUI();
    } else {
        // No session - show welcome screen
        showScreen('language-screen');
    }
});

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

// ============================================
// APP START - FROM WELCOME SCREEN
// ============================================

function startApp() {
    localStorage.setItem('baradhu_started', 'true');
    
    // Check if user already logged in
    const existingUser = getCurrentUser();
    
    if (existingUser) {
        currentUser = existingUser;
        showScreen('home-screen');
        updateUserUI();
        renderLessonsGrid();
        updateProgressUI();
    } else {
        // Show login screen
        showScreen('login-screen');
    }
}

// ============================================
// LOGIN / REGISTER SCREENS
// ============================================

function showRegisterScreen() {
    showScreen('register-screen');
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    document.getElementById('reg-terms').checked = false;
}

function registerUser() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const terms = document.getElementById('reg-terms').checked;
    
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
    const existing = findUserByPhone(phone);
    if (existing) {
        showToast('⚠️ Lakkoofsi kanaan dura galmaa\'eera. Seeni.');
        setTimeout(() => {
            document.getElementById('login-phone').value = phone;
            showScreen('login-screen');
        }, 1500);
        return;
    }
    
    // Create new user
    const users = loadUsers();
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
    
    users.push(newUser);
    saveUsers(users);
    
    // Set as current user
    setCurrentUser(newUser.id);
    currentUser = newUser;
    
    showToast('✅ Galmeen kee milkaa\'eera!');
    showScreen('home-screen');
    updateUserUI();
    renderLessonsGrid();
    updateProgressUI();
}

function loginUser() {
    const phone = document.getElementById('login-phone').value.trim();
    
    if (!phone || !/^09\d{8}$/.test(phone)) {
        showToast('⚠️ Lakkoofsa bilbilaa sirrii galchi (09XXXXXXXX)!');
        return;
    }
    
    const user = findUserByPhone(phone);
    
    if (!user) {
        showToast('❌ Lakkoofsi kanaan hin galmoofne. Dursa galmeessi.');
        setTimeout(() => {
            document.getElementById('reg-phone').value = phone;
            showScreen('register-screen');
        }, 1500);
        return;
    }
    
    // Login successful
    setCurrentUser(user.id);
    currentUser = user;
    
    showToast(`✅ Baga nagaan dhuftan, ${user.name}!`);
    showScreen('home-screen');
    updateUserUI();
    renderLessonsGrid();
    updateProgressUI();
}

// ============================================
// LOGOUT - COMPLETE RESET
// ============================================

function logoutUser() {
    showConfirm(
        'Ba\'uu barbaadda?',
        'Herrega kee keessaa baha. Irra deebi\'uuf odeeffannoo kee galchuu qabda.',
        '👋',
        function() {
            // Clear ALL session data
            localStorage.removeItem('baradhu_started');
            localStorage.removeItem('baradhu_current_user');
            localStorage.removeItem('baradhu_premium');
            
            // Reset variables
            currentUser = null;
            
            // Reset XP display
            const xpDisplay = document.getElementById('total-xp');
            if (xpDisplay) xpDisplay.innerText = '0';
            
            // Close any open modals
            closeUserMenu();
            closePremiumModal();
            
            // Show welcome screen
            showScreen('language-screen');
            
            showToast('👋 Nagaatti! Irra deebi\'uuf seeni.');
        }
    );
}

// ============================================
// USER MENU
// ============================================

function showUserMenu() {
    if (!currentUser) return;
    
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
    
    document.getElementById('user-menu-modal').classList.remove('hidden');
}

function closeUserMenu() {
    document.getElementById('user-menu-modal').classList.add('hidden');
}

function updateUserUI() {
    if (!currentUser) return;
    
    const avatar = document.getElementById('user-avatar');
    const greeting = document.getElementById('user-greeting');
    const userName = document.getElementById('user-name');
    
    if (avatar) avatar.innerText = currentUser.name.charAt(0).toUpperCase();
    if (greeting) greeting.innerText = `Akkam, ${currentUser.name.split(' ')[0]}!`;
    if (userName) userName.innerText = 'Barataa';
    
    const xpDisplay = document.getElementById('total-xp');
    if (xpDisplay) xpDisplay.innerText = totalXP;
}

// ============================================
// CONFIRM MODAL
// ============================================

function showConfirm(title, message, icon, callback) {
    document.getElementById('confirm-icon').innerText = icon;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    confirmCallback = callback;
    
    const okBtn = document.getElementById('confirm-ok-btn');
    okBtn.onclick = function() {
        closeConfirmModal();
        if (confirmCallback) {
            confirmCallback();
        }
    };
    
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
}

// ============================================
// HOME SCREEN
// ============================================

function renderLessonsGrid() {
    const grid = document.getElementById('lessons-grid');
    if (!grid) return;
    
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

// ============================================
// PREMIUM MODAL
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
    document.getElementById('activation-code-input').value = '';
    
    // Update payment info from config
    if (typeof PREMIUM_CONFIG !== 'undefined') {
        // Telebirr info
        document.getElementById('telebirr-name').innerText = PREMIUM_CONFIG.telebirr.accountName;
        document.getElementById('telebirr-number').innerText = PREMIUM_CONFIG.telebirr.number;
        
        // Awash Bank info
        document.getElementById('awash-name').innerText = PREMIUM_CONFIG.awashBank.accountName;
        document.getElementById('awash-number').innerText = PREMIUM_CONFIG.awashBank.accountNumber;
        document.getElementById('awash-branch').innerText = PREMIUM_CONFIG.awashBank.branch;
    }
    
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
    renderLessonsGrid();
}

function handleFailedAttempt(errorMessage) {
    const maxAttempts = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.maxFailedAttempts : 3;
    const lockHours = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.lockDurationHours : 24;
    
    const newAttempts = (currentUser.failedAttempts || 0) + 1;
    const updates = { failedAttempts: newAttempts };
    
    if (newAttempts >= maxAttempts) {
        const lockUntil = new Date();
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
    document.getElementById('error-message').innerText = message;
    errorEl.classList.remove('hidden');
}

// ============================================
// LEARN SCREEN
// ============================================

function startLesson(lessonId) {
    currentLesson = MASTER_LESSONS.find(l => l.id === lessonId);
    if (!currentLesson) return;
    
    currentCardIndex = 0;
    showScreen('learn-screen');
    renderCard();
    renderProgressDots();
}

// Update renderCard function - add this at the end
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
    
    // Update page counter
    document.getElementById('current-page').innerText = currentCardIndex + 1;
    document.getElementById('total-pages').innerText = currentLesson.words.length;
    
    // Handle Previous button state
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.disabled = currentCardIndex === 0;
    }
    
    // Handle Next button - change text on last card
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        if (currentCardIndex === currentLesson.words.length - 1) {
            nextBtn.querySelector('.nav-main-text').innerText = 'Quiz';
            nextBtn.querySelector('.nav-sub-text').innerText = 'Start Test';
        } else {
            nextBtn.querySelector('.nav-main-text').innerText = 'Next';
            nextBtn.querySelector('.nav-sub-text').innerText = 'Continue';
        }
    }
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

// ============================================
// QUIZ
// ============================================

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
    const hasPremium = localStorage.getItem('baradhu_premium') === 'true';
    if (passed) {
        const next = MASTER_LESSONS.find(l => l.id === currentLesson.id + 1);
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
// UTILITIES
// ============================================

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:25px;font-size:14px;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
// Update card progress indicator
function updateCardProgress() {
    const currentCard = currentCardIndex + 1;
    const totalCards = currentLesson.words.length;
    
    // Update text
    document.getElementById('current-card-num').innerText = currentCard;
    document.getElementById('total-card-num').innerText = totalCards;
    
    // Update progress ring
    const progressRing = document.getElementById('card-progress-ring');
    if (progressRing) {
        const circumference = 2 * Math.PI * 26;
        const progress = (currentCard / totalCards) * 100;
        const offset = circumference - (progress / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
    
    // Update button states
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentCardIndex === 0;
    }
    
    if (nextBtn) {
        const nextLabel = document.getElementById('next-btn-label');
        const nextSublabel = document.getElementById('next-btn-sublabel');
        
        if (currentCardIndex === totalCards - 1) {
            if (nextLabel) nextLabel.innerText = 'Qormaata';
            if (nextSublabel) nextSublabel.innerText = 'Jalqabi';
        } else {
            if (nextLabel) nextLabel.innerText = 'Itti Aanu';
            if (nextSublabel) nextSublabel.innerText = 'Itti fufi';
        }
    }
}

// Call this in your renderCard 
// Add this line at the end of renderCard():
// updateCardProgress();