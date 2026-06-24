// ============================================
// BARADHU - COMPLETE APP (FIXED VERSION)
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
// 1. INITIALIZATION - RUNS ONCE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Baradhu app starting...');
    
    // Check if lessons loaded
    if (typeof MASTER_LESSONS === 'undefined' || MASTER_LESSONS.length === 0) {
        console.error('❌ Lessons not loaded!');
        alert('Error: Lessons not loaded. Please refresh.');
        return;
    }
    
    console.log('✅ Loaded ' + MASTER_LESSONS.length + ' lessons');
    
    // Load saved data
    loadData();
    
    // Setup admin
    setupAdminAccess();
    
    // ALWAYS show welcome screen first
    console.log('👋 Showing welcome screen');
    showScreen('language-screen');
});

// ============================================
// 2. LOAD SAVED DATA
// ============================================
function loadData() {
    try {
        const savedLessons = localStorage.getItem('baradhu_completed');
        if (savedLessons) {
            completedLessons = JSON.parse(savedLessons);
        }
        
        const savedXP = localStorage.getItem('baradhu_xp');
        if (savedXP) {
            totalXP = parseInt(savedXP);
        }
        
        console.log('📊 Loaded: ' + completedLessons.length + ' lessons, ' + totalXP + ' XP');
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
    console.log('📺 Showing screen: ' + screenId);
    
    // Hide ALL screens
    var allScreens = document.querySelectorAll('.screen');
    for (var i = 0; i < allScreens.length; i++) {
        allScreens[i].classList.remove('active');
    }
    
    // Show target screen
    var screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        
        // Initialize screen if needed
        if (screenId === 'home-screen') {
            initializeHomeScreen();
        }
    } else {
        console.error('❌ Screen not found: ' + screenId);
    }
}

// ============================================
// 4. START APP (from welcome screen button)
// ============================================
function startApp() {
    console.log('🚀 Starting app...');
    
    // Check if user already logged in
    var userId = localStorage.getItem('baradhu_current_user');
    
    if (userId) {
        // User logged in - load user and go to home
        currentUser = findUserById(userId);
        if (currentUser) {
            console.log('✅ User logged in: ' + currentUser.name);
            showScreen('home-screen');
        } else {
            // User data missing - clear and show login
            console.log('⚠️ User data missing');
            localStorage.removeItem('baradhu_current_user');
            showScreen('login-screen');
        }
    } else {
        // No user - show login screen
        console.log('🔐 Showing login screen');
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
    
    // Update displays
    updateXPDisplay();
    renderLessonsGrid();
    updateProgressUI();
    renderPremiumBanner();
}

// ============================================
// 6. USER AUTHENTICATION
// ============================================

function showRegisterScreen() {
    showScreen('register-screen');
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    var terms = document.getElementById('reg-terms');
    if (terms) terms.checked = false;
}

function registerUser() {
    var name = document.getElementById('reg-name').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    var terms = document.getElementById('reg-terms') ? document.getElementById('reg-terms').checked : true;
    
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
    
    // Check if phone exists
    var existingUser = findUserByPhone(phone);
    if (existingUser) {
        showToast('⚠️ Lakkoofsi kanaan dura galmaa\'eera. Seeni.');
        setTimeout(function() {
            document.getElementById('login-phone').value = phone;
            showScreen('login-screen');
        }, 1500);
        return;
    }
    
    // Create user
    var newUser = {
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
    var users = loadUsers();
    users.push(newUser);
    saveUsers(users);
    
    // Set as current user
    setCurrentUser(newUser.id);
    currentUser = newUser;
    
    console.log('✅ User registered: ' + newUser.name);
    showToast('✅ Galmeen kee milkaa\'eera!');
    
    // Go to home
    showScreen('home-screen');
}

function loginUser() {
    var phone = document.getElementById('login-phone').value.trim();
    
    if (!phone || !/^09\d{8}$/.test(phone)) {
        showToast('⚠️ Lakkoofsa bilbilaa sirrii galchi!');
        return;
    }
    
    var user = findUserByPhone(phone);
    
    if (!user) {
        showToast('❌ Lakkoofsi kanaan hin galmoofne. Galmeessi.');
        setTimeout(function() {
            document.getElementById('reg-phone').value = phone;
            showScreen('register-screen');
        }, 1500);
        return;
    }
    
    // Login
    setCurrentUser(user.id);
    currentUser = user;
    
    console.log('✅ User logged in: ' + user.name);
    showToast('✅ Baga nagaan dhuftan, ' + user.name + '!');
    
    // Go to home
    showScreen('home-screen');
}

function logoutUser() {
    showConfirm(
        'Ba\'uu barbaadda?',
        'Herrega kee keessaa baha.',
        '👋',
        function() {
            // Clear session ONLY
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
        console.log('⚠️ No current user');
        return;
    }
    
    console.log('🔄 Updating UI for: ' + currentUser.name);
    
    // Header
    var avatar = document.getElementById('user-avatar');
    var greeting = document.getElementById('user-greeting');
    var userName = document.getElementById('user-name');
    
    if (avatar) avatar.innerText = currentUser.name.charAt(0).toUpperCase();
    if (greeting) greeting.innerText = 'Akkam, ' + currentUser.name.split(' ')[0] + '!';
    if (userName) userName.innerText = 'Barataa';
    
    // Menu
    var menuAvatar = document.getElementById('menu-avatar');
    var menuName = document.getElementById('menu-user-name');
    var menuPhone = document.getElementById('menu-user-phone');
    var menuXP = document.getElementById('menu-xp');
    var menuLessons = document.getElementById('menu-lessons');
    
    if (menuAvatar) menuAvatar.innerText = currentUser.name.charAt(0).toUpperCase();
    if (menuName) menuName.innerText = currentUser.name;
    if (menuPhone) menuPhone.innerText = currentUser.phone;
    if (menuXP) menuXP.innerText = totalXP + ' XP';
    if (menuLessons) menuLessons.innerText = completedLessons.length + ' Barnoota';
}

function updateXPDisplay() {
    var el = document.getElementById('total-xp');
    if (el) el.innerText = totalXP;
}

// ============================================
// 8. HOME SCREEN
// ============================================
function renderLessonsGrid() {
    var grid = document.getElementById('lessons-grid');
    if (!grid) {
        console.error('❌ Grid not found');
        return;
    }
    
    console.log('📚 Rendering lessons');
    grid.innerHTML = '';
    
    var hasPremium = localStorage.getItem('baradhu_premium') === 'true';
    
    for (var i = 0; i < MASTER_LESSONS.length; i++) {
        var lesson = MASTER_LESSONS[i];
        var isCompleted = completedLessons.indexOf(lesson.id) !== -1;
        var isLocked = lesson.isPremium && !hasPremium;
        
        var card = document.createElement('div');
        var cardClass = 'lesson-card';
        
        if (isCompleted) cardClass += ' completed';
        if (lesson.isPremium && !isLocked) cardClass += ' unlocked';
        if (isLocked) cardClass += ' premium';
        
        card.className = cardClass;
        
        card.onclick = (function(lesson, isLocked) {
            return function() {
                if (isLocked) {
                    openPremiumModal();
                } else {
                    startLesson(lesson.id);
                }
            };
        })(lesson, isLocked);
        
        var statusIcon = '';
        if (isCompleted) statusIcon = '<i class="fas fa-check-circle"></i>';
        else if (isLocked) statusIcon = '<i class="fas fa-lock"></i>';
        else if (lesson.isPremium) statusIcon = '<i class="fas fa-crown"></i>';
        
        var badges = '';
        if (lesson.isPremium && !isLocked) {
            badges += '<div class="premium-tag"><i class="fas fa-crown"></i> UNLOCKED</div>';
        }
        if (isLocked) {
            badges += '<div class="lock-badge"><i class="fas fa-lock"></i> PREMIUM</div>';
        }
        
        card.innerHTML = 
            badges +
            '<div class="lesson-number">' + lesson.id + '</div>' +
            '<div class="lesson-icon">' + (lesson.icon || '📚') + '</div>' +
            '<div class="lesson-title">' + lesson.title + '</div>' +
            '<div class="lesson-words">' + lesson.words.length + ' jecha</div>' +
            '<div class="lesson-status">' + statusIcon + '</div>';
        
        grid.appendChild(card);
    }
}

function updateProgressUI() {
    var total = MASTER_LESSONS.length;
    var completed = completedLessons.length;
    var percent = total > 0 ? (completed / total) * 100 : 0;
    
    var progressText = document.getElementById('progress-text');
    var progressPercent = document.getElementById('progress-percent');
    var progressRing = document.getElementById('progress-ring-fill');
    
    if (progressText) progressText.innerText = completed + ' / ' + total + ' Barnoota';
    if (progressPercent) progressPercent.innerText = Math.round(percent) + '%';
    
    if (progressRing) {
        var circumference = 2 * Math.PI * 36;
        var offset = circumference - (percent / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

function renderPremiumBanner() {
    var container = document.getElementById('premium-banner-container');
    if (!container) return;
    
    var hasPremium = localStorage.getItem('baradhu_premium') === 'true';
    
    if (!hasPremium) {
        container.innerHTML = 
            '<div class="premium-banner" onclick="openPremiumModal()">' +
                '<div class="banner-content">' +
                    '<div class="banner-icon">💎</div>' +
                    '<div class="banner-info">' +
                        '<h3>Barnoota Premium Bani</h3>' +
                        '<p>Barnoota 12 fi jecha 1000+ argadhu</p>' +
                    '</div>' +
                    '<button class="banner-btn">Bani <i class="fas fa-arrow-right"></i></button>' +
                '</div>' +
            '</div>';
    } else {
        container.innerHTML = '';
    }
}

// ============================================
// 9. LESSON & QUIZ
// ============================================
function startLesson(lessonId) {
    currentLesson = null;
    for (var i = 0; i < MASTER_LESSONS.length; i++) {
        if (MASTER_LESSONS[i].id === lessonId) {
            currentLesson = MASTER_LESSONS[i];
            break;
        }
    }
    
    if (!currentLesson) {
        console.error('❌ Lesson not found: ' + lessonId);
        return;
    }
    
    currentCardIndex = 0;
    showScreen('learn-screen');
    renderCard();
    renderProgressDots();
}

function renderCard() {
    var word = currentLesson.words[currentCardIndex];
    var flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    
    document.getElementById('front-lang-label').innerText = 'Afaan Ingilizii';
    document.getElementById('word-primary').innerText = word.english;
    document.getElementById('back-lang-label').innerText = 'Afaan Oromo';
    document.getElementById('word-secondary').innerText = word.oromo;
    document.getElementById('word-example').innerText = '"' + (word.example1 || word.example) + '"';
    document.getElementById('word-example-om').innerText = '→ "' + (word.exampleOromo1 || word.exampleOromo) + '"';
    document.getElementById('word-explanation').innerText = word.explanation;
    
    document.getElementById('lesson-counter').innerText = (currentCardIndex + 1) + '/' + currentLesson.words.length;
    
    var nextBtn = document.getElementById('next-btn');
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
    var container = document.getElementById('lesson-progress-dots');
    if (!container) return;
    
    container.innerHTML = '';
    var maxDots = Math.min(currentLesson.words.length, 10);
    
    for (var i = 0; i < maxDots; i++) {
        var dot = document.createElement('div');
        dot.className = 'progress-dot' + (i === currentCardIndex ? ' active' : '');
        container.appendChild(dot);
    }
}

function updateProgressDots() {
    var dots = document.querySelectorAll('.progress-dot');
    for (var i = 0; i < dots.length; i++) {
        dots[i].className = 'progress-dot' + (i === currentCardIndex ? ' active' : '');
    }
}

function startQuiz() {
    quizScore = 0;
    currentQuizIndex = 0;
    showScreen('quiz-screen');
    renderQuestion();
}

function renderQuestion() {
    var word = currentLesson.words[currentQuizIndex];
    document.getElementById('quiz-word').innerText = word.english;
    document.getElementById('quiz-current-score').innerText = quizScore;
    document.getElementById('quiz-progress').style.width = ((currentQuizIndex / currentLesson.words.length) * 100) + '%';
    
    var container = document.getElementById('quiz-options');
    container.innerHTML = '';
    document.getElementById('quiz-next-btn').classList.add('hidden');
    
    var options = generateOptions(word.oromo);
    for (var i = 0; i < options.length; i++) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerText = options[i];
        btn.onclick = (function(btn, opt, correct) {
            return function() {
                checkAnswer(btn, opt, correct);
            };
        })(btn, options[i], word.oromo);
        container.appendChild(btn);
    }
}

function generateOptions(correctAnswer) {
    var allWords = [];
    for (var i = 0; i < MASTER_LESSONS.length; i++) {
        for (var j = 0; j < MASTER_LESSONS[i].words.length; j++) {
            allWords.push(MASTER_LESSONS[i].words[j].oromo);
        }
    }
    
    var options = [correctAnswer];
    var available = [];
    
    for (var i = 0; i < allWords.length; i++) {
        if (allWords[i] && allWords[i] !== correctAnswer && available.indexOf(allWords[i]) === -1) {
            available.push(allWords[i]);
        }
    }
    
    while (options.length < 4 && available.length > 0) {
        var idx = Math.floor(Math.random() * available.length);
        if (options.indexOf(available[idx]) === -1) {
            options.push(available[idx]);
        }
        available.splice(idx, 1);
    }
    
    while (options.length < 4) {
        options.push('Hin beekamu');
    }
    
    // Shuffle
    for (var i = options.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = options[i];
        options[i] = options[j];
        options[j] = temp;
    }
    
    return options;
}

function checkAnswer(btn, selected, correct) {
    var allOptions = document.querySelectorAll('.quiz-option');
    for (var i = 0; i < allOptions.length; i++) {
        allOptions[i].style.pointerEvents = 'none';
        if (allOptions[i].innerText === correct) {
            allOptions[i].classList.add('correct');
        }
    }
    
    if (selected === correct) {
        quizScore++;
    } else {
        btn.classList.add('wrong');
    }
    
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
    var total = currentLesson.words.length;
    var passed = quizScore >= (total * 0.6);
    var percentage = Math.round((quizScore / total) * 100);
    var xpGained = passed ? (percentage >= 90 ? 100 : percentage >= 75 ? 75 : 50) : 0;
    
    if (passed && completedLessons.indexOf(currentLesson.id) === -1) {
        completedLessons.push(currentLesson.id);
        totalXP += xpGained;
        localStorage.setItem('baradhu_completed', JSON.stringify(completedLessons));
        localStorage.setItem('baradhu_xp', totalXP);
    }
    
    var stars = passed ? (percentage >= 90 ? 3 : percentage >= 75 ? 2 : 1) : 0;
    
    document.getElementById('result-emoji').innerText = passed ? '🏆' : '📚';
    document.getElementById('result-title').innerText = passed ? 'Baga Gammaddan!' : "Irra Deebi'i!";
    document.getElementById('score-percentage').innerText = percentage + '%';
    document.getElementById('score-detail').innerText = quizScore + '/' + total + ' sirrii';
    document.getElementById('xp-gained').innerText = xpGained;
    
    var circle = document.getElementById('score-circle');
    circle.className = 'score-circle';
    if (passed) {
        if (percentage >= 90) circle.classList.add('perfect');
        else if (percentage >= 75) circle.classList.add('great');
        else circle.classList.add('good');
    } else {
        circle.classList.add('failed');
    }
    
    var starsEl = document.querySelectorAll('.stars-rating i');
    for (var i = 0; i < starsEl.length; i++) {
        starsEl[i].className = i < stars ? 'fas fa-star active' : 'far fa-star';
    }
    
    var msg = '';
    if (passed) {
        if (percentage === 100) msg = '🎉 Qabxii guutuu!';
        else if (percentage >= 90) msg = '🌟 Baay\'ee gaarii!';
        else if (percentage >= 75) msg = '👍 Hojii gaarii!';
        else msg = '✅ Hojii gaarii!';
    } else {
        msg = '60% barbaachisa. Qabxiin kee ' + percentage + '%.';
    }
    document.getElementById('result-message').innerText = msg;
    
    document.getElementById('retry-btn').classList.toggle('hidden', passed);
    
    var nextBtn = document.getElementById('next-lesson-btn');
    if (passed) {
        var next = null;
        for (var i = 0; i < MASTER_LESSONS.length; i++) {
            if (MASTER_LESSONS[i].id === currentLesson.id + 1) {
                next = MASTER_LESSONS[i];
                break;
            }
        }
        
        var hasPremium = localStorage.getItem('baradhu_premium') === 'true';
        if (next && (!next.isPremium || hasPremium)) {
            nextBtn.classList.remove('hidden');
            nextBtn.innerHTML = 'Barnoota ' + next.id + ': ' + next.title + ' <i class="fas fa-arrow-right"></i>';
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
    var container = document.getElementById('confetti');
    container.innerHTML = '';
    if (!show) return;
    
    var colors = ['#FFD700', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0'];
    
    for (var i = 0; i < 30; i++) {
        var conf = document.createElement('div');
        conf.style.cssText = 
            'position:absolute;' +
            'width:10px;' +
            'height:10px;' +
            'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
            'left:' + (Math.random() * 100) + '%;' +
            'top:-10px;' +
            'border-radius:50%;' +
            'animation:fall ' + (Math.random() * 2 + 2) + 's linear;';
        container.appendChild(conf);
    }
    
    setTimeout(function() {
        container.innerHTML = '';
    }, 5000);
}

function retryLesson() {
    startLesson(currentLesson.id);
}

function goToNextLesson() {
    var next = null;
    for (var i = 0; i < MASTER_LESSONS.length; i++) {
        if (MASTER_LESSONS[i].id === currentLesson.id + 1) {
            next = MASTER_LESSONS[i];
            break;
        }
    }
    
    if (next) {
        startLesson(next.id);
    } else {
        showScreen('home-screen');
    }
}

// ============================================
// 10. PREMIUM MODAL
// ============================================
function openPremiumModal() {
    if (!currentUser) {
        showScreen('login-screen');
        return;
    }
    
    currentUser = findUserById(currentUser.id);
    
    document.getElementById('premium-modal').classList.remove('hidden');
    document.getElementById('activation-error').classList.add('hidden');
    
    var codeInput = document.getElementById('activation-code-input');
    if (codeInput) codeInput.value = '';
    
    updateAttemptsDisplay();
}

function closePremiumModal() {
    document.getElementById('premium-modal').classList.add('hidden');
}

function updateAttemptsDisplay() {
    if (!currentUser) return;
    
    var attemptsInfo = document.getElementById('attempts-info');
    var attemptsText = document.getElementById('attempts-text');
    var maxAttempts = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.maxFailedAttempts : 3;
    var remaining = maxAttempts - (currentUser.failedAttempts || 0);
    
    if (attemptsText) {
        attemptsText.innerHTML = 'Yaalii hafe: <strong>' + remaining + '</strong>';
    }
    
    if (attemptsInfo) {
        if (remaining <= 1) {
            attemptsInfo.classList.add('danger');
        } else {
            attemptsInfo.classList.remove('danger');
        }
    }
}

function verifyActivationCode() {
    if (!currentUser) return;
    
    currentUser = findUserById(currentUser.id);
    
    var input = document.getElementById('activation-code-input');
    var enteredCode = input.value.trim().toUpperCase();
    
    if (!enteredCode) {
        showActivationError('⚠️ Maaloo koodii galchi!');
        return;
    }
    
    var codeEntry = findCodeByValue(enteredCode);
    
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
    
    // Success
    codeEntry.used = true;
    codeEntry.usedAt = new Date().toISOString();
    var codes = loadCodes();
    var idx = -1;
    for (var i = 0; i < codes.length; i++) {
        if (codes[i].code === codeEntry.code) {
            idx = i;
            break;
        }
    }
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
    
    initializeHomeScreen();
}

function handleFailedAttempt(errorMessage) {
    var maxAttempts = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.maxFailedAttempts : 3;
    var newAttempts = (currentUser.failedAttempts || 0) + 1;
    
    var updates = {
        failedAttempts: newAttempts,
        lastAttemptAt: new Date().toISOString()
    };
    
    if (newAttempts >= maxAttempts) {
        var lockUntil = new Date();
        var lockHours = (typeof PREMIUM_CONFIG !== 'undefined') ? PREMIUM_CONFIG.lockDurationHours : 24;
        lockUntil.setHours(lockUntil.getHours() + lockHours);
        updates.isLocked = true;
        updates.lockedUntil = lockUntil.toISOString();
        
        updateUser(currentUser.id, updates);
        currentUser = findUserById(currentUser.id);
        
        showActivationError('🔒 Herregni kee sa\'aatii ' + lockHours + 'f cufameera!');
        return;
    }
    
    updateUser(currentUser.id, updates);
    currentUser = findUserById(currentUser.id);
    
    var remaining = maxAttempts - newAttempts;
    showActivationError(errorMessage + ' (Yaalii hafe: ' + remaining + ')');
}

function showActivationError(message) {
    var errorEl = document.getElementById('activation-error');
    var errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.innerText = message;
    if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.style.animation = 'none';
        setTimeout(function() {
            errorEl.style.animation = 'shake 0.5s';
        }, 10);
    }
}

// ============================================
// 11. USER MENU
// ============================================
function showUserMenu() {
    if (!currentUser) return;
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
    
    var okBtn = document.getElementById('confirm-ok-btn');
    okBtn.onclick = function() {
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
// 13. ADMIN
// ============================================
var adminTapCount = 0;
var adminTapTimer = null;

function setupAdminAccess() {
    var title = document.getElementById('app-title');
    if (title) {
        title.addEventListener('click', function() {
            adminTapCount++;
            clearTimeout(adminTapTimer);
            adminTapTimer = setTimeout(function() {
                adminTapCount = 0;
            }, 2000);
            
            if (adminTapCount >= 5) {
                adminTapCount = 0;
                openAdminPanel();
            }
        });
    }
}

function openAdminPanel() {
    var password = prompt('🔐 Admin Password:');
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
    var users = loadUsers();
    console.log('📊 Admin: ' + users.length + ' users');
}

// ============================================
// 14. UTILITIES
// ============================================
function showToast(msg) {
    console.log('💬', msg);
    
    var toast = document.createElement('div');
    toast.style.cssText = 
        'position:fixed;' +
        'bottom:30px;' +
        'left:50%;' +
        'transform:translateX(-50%);' +
        'background:#333;' +
        'color:white;' +
        'padding:12px 24px;' +
        'border-radius:25px;' +
        'font-size:14px;' +
        'z-index:9999;' +
        'box-shadow:0 4px 15px rgba(0,0,0,0.3);' +
        'max-width:90%;' +
        'text-align:center;';
    toast.innerText = msg;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 2500);
}

console.log('📝 app.js loaded');
console.log('🔧 All functions ready');
