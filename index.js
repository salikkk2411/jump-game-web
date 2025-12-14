  const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 400;
        const GROUND_HEIGHT = 50;
        const GRAVITY = 0.5;

        // Game State
        const GAME_STATES = {
            MENU: 0,
            PLAYING: 1,
            GAME_OVER: 2,
            PAUSED: 3
        };

        // Player Class
        class Player {
            constructor(game) {
                this.game = game;
                this.width = 40;
                this.height = 40;
                this.x = 100;
                this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
                this.velocityY = 0;
                this.jumpPower = -12;
                this.isJumping = false;
                this.color = '#E74C3C';
            }

            jump() {
                if (!this.isJumping) {
                    this.velocityY = this.jumpPower;
                    this.isJumping = true;
                    this.game.createParticles(this.x + this.width/2, this.y + this.height, 10, '#3498db');
                    
                    if (this.game.sounds) {
                        this.game.sounds.jump.play();
                    }
                }
            }

            update() {
                // Apply gravity
                this.velocityY += GRAVITY;
                this.y += this.velocityY;

                // Ground collision
                if (this.y >= CANVAS_HEIGHT - GROUND_HEIGHT - this.height) {
                    this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    
                    // Create landing particles
                    if (Math.abs(this.velocityY) > 2) {
                        this.game.createParticles(this.x + this.width/2, this.y + this.height, 8, '#f1c40f');
                    }
                }
            }

            draw() {
                const { ctx } = this.game;
                
                // Draw player body
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Draw player details
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 25, this.y + 10, 8, 8);
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 27, this.y + 12, 4, 4);
                
                // Draw smile
                ctx.beginPath();
                ctx.arc(this.x + 15, this.y + 25, 5, 0, Math.PI, false);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Obstacle Class
        class Obstacle {
            constructor(game) {
                this.game = game;
                this.width = 30;
                this.height = Math.random() * 30 + 20;
                this.x = CANVAS_WIDTH;
                this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
                this.color = '#2C3E50';
                this.speed = this.game.gameSpeed;
            }

            update() {
                this.x -= this.game.gameSpeed;

            }

            draw() {
                const { ctx } = this.game;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Draw obstacle details
                ctx.fillStyle = '#7f8c8d';
                for(let i = 0; i < this.height; i += 10) {
                    ctx.fillRect(this.x + 5, this.y + i, 5, 5);
                    ctx.fillRect(this.x + 20, this.y + i, 5, 5);
                }
            }
        }

        // Cloud Class for background
        class Cloud {
            constructor(game) {
                this.game = game;
                this.width = Math.random() * 60 + 40;
                this.height = Math.random() * 20 + 20;
                this.x = CANVAS_WIDTH + Math.random() * 300;
                this.y = Math.random() * 150;
                this.speed = Math.random() * 0.5 + 0.5;
                this.color = 'rgba(255, 255, 255, 0.9)';
            }

            update() {
                this.x -= this.speed;
                if (this.x < -this.width) {
                    this.x = CANVAS_WIDTH + Math.random() * 300;
                    this.y = Math.random() * 150;
                }
            }

            draw() {
                const { ctx } = this.game;
                ctx.fillStyle = this.color;
                
                // Draw fluffy cloud
                ctx.beginPath();
                ctx.arc(this.x + 20, this.y + 10, 15, 0, Math.PI * 2);
                ctx.arc(this.x + 40, this.y + 5, 20, 0, Math.PI * 2);
                ctx.arc(this.x + 60, this.y + 10, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Main Game Class
        class SuperJumper {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.width = CANVAS_WIDTH;
                this.canvas.height = CANVAS_HEIGHT;
                
                this.gameState = GAME_STATES.MENU;
                this.score = 0;
                this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
                this.gameSpeed = 3;
                this.particles = [];
                
                this.initElements();
                this.initEventListeners();
                this.initAudio();
                this.initGame();
            }
            
            initElements() {
                this.startScreen = document.getElementById('start-screen');
                this.gameScreen = document.getElementById('game-screen');
                this.gameOverScreen = document.getElementById('game-over-screen');
                this.scoreDisplay = document.getElementById('score-display');
                this.highScoreDisplay = document.getElementById('high-score');
                this.finalScoreDisplay = document.getElementById('final-score');
                this.newHighScoreDisplay = document.getElementById('new-high-score');
                
                this.highScoreDisplay.textContent = this.highScore;
            }
            
            initEventListeners() {
                document.getElementById('start-btn').addEventListener('click', () => this.startGame());
                document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
                
                document.addEventListener('keydown', (e) => {
                    if (e.code === 'Space') {
                        if (this.gameState === GAME_STATES.PLAYING) {
                            this.player.jump();
                        } else if (this.gameState === GAME_STATES.MENU || 
                                   this.gameState === GAME_STATES.GAME_OVER) {
                            this.startGame();
                        }
                    }
                    
                    if (e.code === 'KeyP') {
                        if (this.gameState === GAME_STATES.PLAYING) {
                            this.pauseGame();
                        } else if (this.gameState === GAME_STATES.PAUSED) {
                            this.resumeGame();
                        }
                    }
                });
            }
            
            initAudio() {
                // Create sound effects using oscillator as fallback
                try {
                    this.sounds = {
                        jump: new Howl({ src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqNkJKUl5qdn6Cio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8='], volume: 0.3 }),
                        gameOver: new Howl({ src: ['data:audio/wav;base64,UklGRnoHAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVQHAACDh4yQlJebnqGkp6mrrrCztba4ubq8vcDBw8bIyczP0dPV19nb3d/h5Obn6ert7/H09vf5+/z9/wECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8='], volume: 0.5 })
                    };
                } catch (e) {
                    console.log("Audio initialization failed, proceeding without sound");
                    this.sounds = null;
                }
            }
            
            initGame() {
                this.player = new Player(this);
                this.obstacles = [];
                this.clouds = [];
                this.lastObstacleTime = 0;
                this.animationId = null;
                this.particles = [];
                
                // Create initial clouds
                for (let i = 0; i < 5; i++) {
                    this.clouds.push(new Cloud(this));
                }
            }
            
            startGame() {
                this.gameState = GAME_STATES.PLAYING;
                this.startScreen.classList.add('hidden');
                this.gameScreen.classList.remove('hidden');
                this.gameOverScreen.classList.add('hidden');
                this.score = 0;
                this.gameSpeed = 3;
                this.initGame();
                
                if (this.sounds) {
                    this.sounds.gameOver.stop();
                }
                
                this.gameLoop();
            }
            
            pauseGame() {
                this.gameState = GAME_STATES.PAUSED;
                cancelAnimationFrame(this.animationId);
                this.drawPauseScreen();
            }
            
            drawPauseScreen() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '40px "Press Start 2P"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
                this.ctx.font = '20px "Press Start 2P"';
                this.ctx.fillText('Press P to resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
            }
            
            resumeGame() {
                this.gameState = GAME_STATES.PLAYING;
                this.gameLoop();
            }
            
            gameOver() {
                this.gameState = GAME_STATES.GAME_OVER;
                cancelAnimationFrame(this.animationId);
                
                // Update high score
                const displayScore = Math.floor(this.score / 10);
                if (displayScore > this.highScore) {
                    this.highScore = displayScore;
                    localStorage.setItem('highScore', this.highScore);
                }
                
                // Update game over screen
                this.finalScoreDisplay.textContent = displayScore;
                this.newHighScoreDisplay.textContent = this.highScore;
                
                // Show game over screen
                this.gameScreen.classList.add('hidden');
                this.gameOverScreen.classList.remove('hidden');
                
                if (this.sounds) {
                    this.sounds.gameOver.play();
                }
                
                // Create explosion particles
                this.createParticles(
                    this.player.x + this.player.width/2, 
                    this.player.y + this.player.height/2, 
                    50, 
                    '#e74c3c'
                );
                this.animateExplosion();
            }
            
            animateExplosion() {
                const explosionLoop = () => {
                    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    this.drawBackground();
                    this.drawClouds();
                    this.drawObstacles();
                    
                    // Draw particles
                    for (let i = 0; i < this.particles.length; i++) {
                        const p = this.particles[i];
                        p.y += p.velocityY;
                        p.x += p.velocityX;
                        p.life--;
                        
                        if (p.life > 0) {
                            this.ctx.globalAlpha = p.life / 100;
                            this.ctx.fillStyle = p.color;
                            this.ctx.beginPath();
                            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                            this.ctx.fill();
                        } else {
                            this.particles.splice(i, 1);
                            i--;
                        }
                    }
                    
                    if (this.particles.length > 0) {
                        requestAnimationFrame(explosionLoop);
                    }
                };
                
                explosionLoop();
            }
            
            createParticles(x, y, count, color) {
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: x,
                        y: y,
                        size: Math.random() * 5 + 2,
                        velocityX: Math.random() * 6 - 3,
                        velocityY: Math.random() * 6 - 3,
                        color: color,
                        life: Math.random() * 60 + 40
                    });
                }
            }
            
            restartGame() {
                this.gameOverScreen.classList.add('hidden');
                this.startGame();
            }
            
            gameLoop(timestamp) {
                if (this.gameState !== GAME_STATES.PLAYING) return;
                
                // Clear canvas
                this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                // Draw background
                this.drawBackground();
                
                // Update and draw game objects
                this.player.update();
                this.player.draw();
                
                this.updateObstacles();
                this.drawObstacles();
                
                this.updateClouds();
                this.drawClouds();
                
                // Draw particles
                this.drawParticles();
                
                // Check collisions
                this.checkCollisions();
                
                // Update score
                this.updateScore();
                
                // Generate new obstacles
                if (timestamp - this.lastObstacleTime > 1500) {
                    this.generateObstacle();
                    this.lastObstacleTime = timestamp;
                }
                
                // Increase difficulty
                if (this.score > 0 && this.score % 500 === 0) {
                    this.gameSpeed += 0.75;
                }
                
                this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
            }
            
            drawBackground() {
                const ctx = this.ctx;
                
                // Draw sky
                const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
                gradient.addColorStop(0, '#1a75bc');
                gradient.addColorStop(1, '#87CEEB');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                // Draw distant mountains
                ctx.fillStyle = '#34495e';
                ctx.beginPath();
                ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
                for(let i = 0; i < CANVAS_WIDTH; i += 100) {
                    ctx.lineTo(i, CANVAS_HEIGHT - GROUND_HEIGHT - Math.sin(i/50) * 30 - 50);
                }
                ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
                ctx.fill();
                
                // Draw ground
                ctx.fillStyle = '#27AE60';
                ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
                
                // Draw grass details
                ctx.fillStyle = '#2ECC71';
                for (let i = 0; i < CANVAS_WIDTH; i += 5) {
                    const height = Math.random() * 10 + 5;
                    ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT - height, 3, height);
                }
            }
            
            drawParticles() {
                for (let i = 0; i < this.particles.length; i++) {
                    const p = this.particles[i];
                    p.y += p.velocityY;
                    p.x += p.velocityX;
                    p.life--;
                    
                    if (p.life > 0) {
                        this.ctx.globalAlpha = p.life / 100;
                        this.ctx.fillStyle = p.color;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else {
                        this.particles.splice(i, 1);
                        i--;
                    }
                }
                this.ctx.globalAlpha = 1.0;
            }
            
            generateObstacle() {
                this.obstacles.push(new Obstacle(this));
            }
            
            updateObstacles() {
                for (let i = 0; i < this.obstacles.length; i++) {
                    this.obstacles[i].update();
                    
                    // Remove off-screen obstacles
                    if (this.obstacles[i].x < -this.obstacles[i].width) {
                        this.obstacles.splice(i, 1);
                        i--;
                    }
                }
            }
            
            drawObstacles() {
                this.obstacles.forEach(obstacle => obstacle.draw());
            }
            
            updateClouds() {
                this.clouds.forEach(cloud => cloud.update());
            }
            
            drawClouds() {
                this.clouds.forEach(cloud => cloud.draw());
            }
            
            checkCollisions() {
                const player = this.player;
                for (let i = 0; i < this.obstacles.length; i++) {
                    const obstacle = this.obstacles[i];
                    
                    if (
                        player.x < obstacle.x + obstacle.width &&
                        player.x + player.width > obstacle.x &&
                        player.y < obstacle.y + obstacle.height &&
                        player.y + player.height > obstacle.y
                    ) {
                        this.gameOver();
                        return;
                    }
                }
            }
            
            updateScore() {
                this.score += 1;
                this.scoreDisplay.textContent = `Score: ${Math.floor(this.score / 10)}`;
            }
        }

        // Start the game when loaded
        window.addEventListener('load', () => {
            const game = new SuperJumper();
        });

