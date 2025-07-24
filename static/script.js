
class SoloLevelerApp {
    constructor() {
        this.currentScreen = 'daily-tasks';
        this.dailyTasks = [];
        this.streak = 0;
        this.timer = null;
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.loadDailyTasks();
        this.startTimer();
        this.setupTaskInteractions();
    }
    
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const screens = document.querySelectorAll('.screen');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetScreen = btn.dataset.screen;
                if (!targetScreen) return;
                
                // Update active nav button
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active screen
                screens.forEach(screen => {
                    screen.classList.remove('active');
                    if (screen.id === targetScreen) {
                        screen.classList.add('active');
                    }
                });
                
                this.currentScreen = targetScreen;
            });
        });
    }
    
    async loadDailyTasks() {
        try {
            const response = await fetch('/api/daily_tasks');
            const data = await response.json();
            
            this.dailyTasks = data.tasks;
            this.streak = data.streak;
            
            this.renderTasks();
            this.updateStreak();
        } catch (error) {
            console.error('Error loading daily tasks:', error);
        }
    }
    
    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        if (!tasksList) return;
        
        tasksList.innerHTML = '';
        
        this.dailyTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                     data-task-id="${task.id}"></div>
                <div class="task-text ${task.completed ? 'completed' : ''}">${task.name}</div>
            `;
            
            tasksList.appendChild(taskElement);
        });
    }
    
    setupTaskInteractions() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const taskId = parseInt(e.target.dataset.taskId);
                await this.toggleTask(taskId);
            }
        });
    }
    
    async toggleTask(taskId) {
        try {
            const response = await fetch('/api/complete_task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task_id: taskId })
            });
            
            if (response.ok) {
                await this.loadDailyTasks();
                this.addGlowEffect();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }
    
    updateStreak() {
        const streakNumber = document.querySelector('.streak-number');
        if (streakNumber) {
            streakNumber.textContent = this.streak;
        }
    }
    
    startTimer() {
        this.updateTimer();
        this.timer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeRemaining = tomorrow - now;
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    addGlowEffect() {
        const questInfoBox = document.querySelector('.quest-info-box');
        if (questInfoBox) {
            questInfoBox.classList.add('glow');
            setTimeout(() => {
                questInfoBox.classList.remove('glow');
            }, 1000);
        }
    }
    
    // Level progress animation
    animateLevelProgress() {
        const levelProgress = document.querySelector('.level-progress');
        if (levelProgress) {
            levelProgress.style.width = '0%';
            setTimeout(() => {
                levelProgress.style.transition = 'width 2s ease-in-out';
                levelProgress.style.width = '60%';
            }, 100);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SoloLevelerApp();
    
    // Add some visual enhancements
    setTimeout(() => {
        app.animateLevelProgress();
    }, 500);
    
    // Add touch interactions for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - could implement screen navigation
                console.log('Swiped left');
            } else {
                // Swipe right
                console.log('Swiped right');
            }
        }
    }
});

// Add some Easter eggs and animations
document.addEventListener('keydown', (e) => {
    // Konami code or special key combinations
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        // Level up animation
        const levelText = document.querySelector('.level-text');
        if (levelText) {
            levelText.style.animation = 'glow 0.5s ease-in-out 3';
        }
    }
});
