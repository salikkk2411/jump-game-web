const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        const scoreDisplay = document.getElementById("scoreDisplay");

        let player = {
            x: 50,
            y: 300,
            width: 30,
            height: 30,
            color: "red",
            velocityY: 0,
            gravity: 0.5,
            jumpPower: -10,
            isJumping: false
        };

        let obstacles = [];
        let gameSpeed = 3;
        let score = 0;
        let gameOver = false;

        function drawPlayer() {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        function updatePlayer() {
            player.y += player.velocityY;
            player.velocityY += player.gravity;
            if (player.y >= 300) {
                player.y = 300;
                player.isJumping = false;
            }
        }

        function generateObstacle() {
            if (!gameOver) {
                obstacles.push({ x: 800, y: 320, width: 20, height: 30, color: "black" });
            }
        }

        function drawObstacles() {
            ctx.fillStyle = "black";
            obstacles.forEach(obstacle => {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            });
        }

        function updateObstacles() {
            obstacles.forEach(obstacle => obstacle.x -= gameSpeed);
            obstacles = obstacles.filter(obstacle => obstacle.x > -20);
        }

        function checkCollision() {
            obstacles.forEach(obstacle => {
                if (
                    player.x < obstacle.x + obstacle.width &&
                    player.x + player.width > obstacle.x &&
                    player.y < obstacle.y + obstacle.height &&
                    player.y + player.height > obstacle.y
                ) {
                    gameOver = true;
                    alert("Game Over! Your score: " + Math.floor(score / 10));
                    document.location.reload();
                }
            });
        }

        function updateScore() {
            if (!gameOver) {
                score++;
                scoreDisplay.innerText = "Score: " + Math.floor(score / 10);
            }
        }

        function gameLoop() {
            if (!gameOver) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawPlayer();
                drawObstacles();
                updatePlayer();
                updateObstacles();
                checkCollision();
                updateScore();
                requestAnimationFrame(gameLoop);
            }
        }

        document.addEventListener("keydown", (event) => {
            if (event.code === "Space" && !player.isJumping) {
                player.velocityY = player.jumpPower;
                player.isJumping = true;
            }
        });

        setInterval(generateObstacle, 2000);
        setInterval(updateScore, 100);
        gameLoop();