// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Objeto jugador
const jugador = {
    x: 200,
    y: 100,
    width: 20,
    height: 20,
    color: 'green',
    speed: 3,
    vy: 0,
    gravedad: 0.6,
    fuerzaSalto: -12,
    enSuelo: false
};

// Configuración del juego
const sueloY = 420;
let plataformas = [];
let gameState = 'playing';
let nivel = 1;

// Objetivo (moneda)
const objetivo = {
    x: 600,
    y: sueloY - 20,
    radius: 10,
    collected: false
};

// Control de teclas (soporte para flechas y WASD)
const keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// Eventos de teclado
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    
    // Saltar con W o flecha arriba
    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && jugador.enSuelo) {
        jugador.vy = jugador.fuerzaSalto;
        jugador.enSuelo = false;
        reproducirSonidoSalto();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
});

// Cargar sonido de salto
let jumpSound = new Audio('jump.mp3');
jumpSound.preload = 'auto';
jumpSound.addEventListener('error', () => {
    console.warn("No se pudo cargar 'jump.mp3'");
});

function reproducirSonidoSalto() {
    if (jumpSound) {
        try {
            jumpSound.currentTime = 0;
            const p = jumpSound.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (err) {
            // Ignorar errores de autoplay
        }
    }
}

// Función de actualización
function actualizar(delta) {
    if (gameState !== 'playing') return;
    
    // Movimiento horizontal (izquierda/derecha)
    const velocidad = jugador.speed;
    if (keys.left) jugador.x -= velocidad;
    if (keys.right) jugador.x += velocidad;
    
    // Movimiento vertical libre (arriba/abajo) - solo cuando está en el aire
    // Esto permite un control más directo además de la gravedad
    if (keys.up && !jugador.enSuelo) {
        jugador.vy -= 0.3; // Impulso hacia arriba
    }
    if (keys.down && !jugador.enSuelo) {
        jugador.vy += 0.5; // Acelera la caída
    }
    
    // Aplicar gravedad
    jugador.vy += jugador.gravedad;
    const nextY = jugador.y + jugador.vy;
    
    // Colisión con plataformas
    let onAnyPlatform = false;
    for (const plat of plataformas) {
        const overlapX = jugador.x + jugador.width > plat.x && 
                        jugador.x < plat.x + plat.width;
        
        if (!overlapX) continue;
        
        const foot = jugador.y + jugador.height;
        const nextFoot = nextY + jugador.height;
        
        if (foot <= plat.y && nextFoot >= plat.y) {
            jugador.y = plat.y - jugador.height;
            jugador.vy = 0;
            jugador.enSuelo = true;
            onAnyPlatform = true;
            break;
        }
    }
    
    if (!onAnyPlatform) {
        jugador.y = nextY;
        jugador.enSuelo = false;
    }
    
    // Verificar caída fuera del canvas
    if (jugador.y > canvas.height + 50) {
        perder();
    }
    
    // Limitar movimiento horizontal
    if (jugador.x < 0) jugador.x = 0;
    if (jugador.x + jugador.width > canvas.width) {
        jugador.x = canvas.width - jugador.width;
    }
    
    // Colisión con objetivo
    if (!objetivo.collected) {
        const cx = jugador.x + jugador.width / 2;
        const cy = jugador.y + jugador.height / 2;
        const dx = cx - objetivo.x;
        const dy = cy - objetivo.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < objetivo.radius + Math.max(jugador.width, jugador.height) / 2) {
            objetivo.collected = true;
            if (nivel === 1) avanzarNivel();
            else if (nivel === 2) terminarJuego();
        }
    }
}

// Avanzar de nivel
function avanzarNivel() {
    nivel = 2;
    jugador.color = 'red';
    jugador.speed = 6;
    objetivo.x = -100;
    objetivo.y = -100;
    setupLevel(2);
}

// Perder el juego
function perder() {
    if (gameState !== 'playing') return;
    gameState = 'lost';
    setTimeout(() => {
        restartLevel();
    }, 1200);
}

// Terminar el juego
function terminarJuego() {
    gameState = 'finished';
    document.getElementById('restartBtn').style.display = 'inline-block';
}

// Reiniciar nivel actual
function restartLevel() {
    setupLevel(nivel);
    gameState = 'playing';
}

// Reiniciar todo el juego
function resetGame() {
    document.getElementById('restartBtn').style.display = 'none';
    setupLevel(1);
    gameState = 'playing';
}

// Configurar nivel
function setupLevel(n) {
    nivel = n;
    objetivo.collected = false;
    
    if (n === 1) {
        plataformas = [
            { x: 0, y: sueloY, width: 300 },
            { x: 360, y: sueloY, width: 120 },
            { x: 520, y: sueloY, width: 260 }
        ];
        objetivo.x = plataformas[2].x + plataformas[2].width - 30;
        objetivo.y = plataformas[2].y - objetivo.radius;
        jugador.x = 200;
        jugador.y = 100;
        jugador.vy = 0;
        jugador.speed = 3;
        jugador.color = 'green';
        jugador.enSuelo = false;
    } else if (n === 2) {
        plataformas = [
            { x: 0, y: sueloY, width: 180 },
            { x: 240, y: sueloY, width: 100 },
            { x: 360, y: sueloY, width: 90 },
            { x: 480, y: sueloY, width: 100 },
            { x: 620, y: sueloY, width: 180 }
        ];
        objetivo.x = plataformas[4].x + plataformas[4].width - 40;
        objetivo.y = plataformas[4].y - objetivo.radius;
        jugador.x = 40;
        jugador.y = plataformas[0].y - jugador.height;
        jugador.vy = 0;
        jugador.speed = 6;
        jugador.color = 'red';
        jugador.enSuelo = true;
    }
    
    document.getElementById('restartBtn').style.display = 'none';
}

// Función de dibujo
function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar plataformas con efecto de perspectiva
    ctx.fillStyle = '#654321';
    for (const plat of plataformas) {
        // Sombra para profundidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        ctx.fillRect(plat.x, plat.y, plat.width, canvas.height - plat.y);
        
        // Borde superior más claro para efecto 3D
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(plat.x, plat.y, plat.width, 3);
        ctx.fillStyle = '#654321';
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Dibujar objetivo (moneda)
    if (!objetivo.collected) {
        ctx.beginPath();
        // Color seguro usando RGBA
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.arc(objetivo.x, objetivo.y, objetivo.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 242, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Dibujar jugador con sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = jugador.color;
    ctx.fillRect(jugador.x, jugador.y, jugador.width, jugador.height);
    
    // Borde del jugador
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(jugador.x, jugador.y, jugador.width, jugador.height);
    
    // Texto del nivel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 28px Arial';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText('Nivel: ' + nivel, 10, 34);
    ctx.fillText('Nivel: ' + nivel, 10, 34);
    
    // Firma en el suelo
    const sueloTop = sueloY;
    const sueloHeight = canvas.height - sueloY;
    ctx.fillStyle = '#000';
    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LUIS PAZ SAAVEDRA', canvas.width / 2, sueloTop + sueloHeight / 2);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    
    // Overlay de pérdida
    if (gameState === 'lost') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.strokeText('PERDISTE', canvas.width / 2, canvas.height / 2);
        ctx.fillText('PERDISTE', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'start';
    }
    
    // Overlay de finalización
    if (gameState === 'finished') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.strokeText('¡Fin del juego!', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText('¡Fin del juego!', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.strokeText('Gracias por jugar', canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Gracias por jugar', canvas.width / 2, canvas.height / 2 + 10);
        ctx.textAlign = 'start';
    }
}

// Loop principal del juego
let lastTime = 0;
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    actualizar(delta);
    dibujar();
    
    requestAnimationFrame(loop);
}

// Inicializar
setupLevel(1);
requestAnimationFrame(loop);

// Botón de reinicio
document.getElementById('restartBtn').addEventListener('click', () => {
    resetGame();
});

// Intentar cargar el GIF de fondo
(function tryApplyGifBackground() {
    const test = new Image();
    test.onload = () => {
        canvas.style.backgroundImage = "url('fondo.gif')";
        canvas.style.backgroundSize = 'cover';
        canvas.style.backgroundPosition = 'center';
        canvas.style.backgroundRepeat = 'no-repeat';
        console.log('fondo.gif cargado correctamente');
    };
    test.onerror = () => {
        console.warn("No se encontró 'fondo.gif'");
    };
    test.src = 'fondo.gif';
})();