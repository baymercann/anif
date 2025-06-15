const canvas = document.getElementById("fireworkCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fireworks = [];
let particles = [];
let heartPoints = [];
let reachedPoints = []; // Kalp çizgisi için patlayan noktalar
let slowFireworks = []; // Yavaş yukarı çıkan havai fişekler için

let showText = false;    // Yazının görünme durumu
let showPulse = false;   // Pulse efekti görünme durumu
let textAlpha = 0;       // Yazı için alfa değeri (opaklık)

let pulseStates = [];    // Kalp noktalarındaki pulse halkalarının durumu

// Rastgele sayı üret
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Kalp şekli için noktaları hesapla ve pulseStates başlat
function generateHeartPoints() {
  heartPoints = [];
  pulseStates = [];
  for (let t = 0; t < Math.PI * 2; t += 0.05) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    const point = {
      x: canvas.width / 2 + x * 20,
      y: canvas.height / 2 + y * 20
    };
    heartPoints.push(point);

    // Pulse halkası için başlangıç değerleri
    pulseStates.push({
      radius: 10 + Math.random() * 5,
      maxRadius: 25 + Math.random() * 10,
      alpha: 0.5 + Math.random() * 0.5,
      growing: Math.random() > 0.5
    });
  }
}

// Havai fişek sınıfı
class Firework {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = 4;
    this.angle = Math.atan2(targetY - y, targetX - x);
    this.distance = Math.hypot(targetX - x, targetY - y);
    this.distanceTraveled = 0;
  }

  update(index) {
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.x += vx;
    this.y += vy;
    this.distanceTraveled += Math.hypot(vx, vy);

    if (this.distanceTraveled >= this.distance) {
      createParticles(this.targetX, this.targetY);
      reachedPoints.push({ x: this.targetX, y: this.targetY }); // Kalp çizgisine ekle
      fireworks.splice(index, 1);
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#cc66ff"; // Açık mor havaifişek izi
    ctx.fill();
  }
}

// Patlayan parçacıklar
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(1, 3);
    this.angle = random(0, Math.PI * 2);
    this.alpha = 1;
    this.decay = random(0.002, 0.005);
  }

  update(index) {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + 0.2;
    this.alpha -= this.decay;
    if (this.alpha <= 0) {
      particles.splice(index, 1);
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(204, 102, 255, ${this.alpha})`;
    ctx.fill();
  }
}

// Patlama anında parçacıklar oluştur
function createParticles(x, y) {
  for (let i = 0; i < 75; i++) {
    particles.push(new Particle(x, y));
  }
}

// Kalp çizgisini çiz
function drawHeartPath() {
  if (reachedPoints.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "#cc66ff"; // Mor çizgi
    ctx.lineWidth = 2;
    ctx.moveTo(reachedPoints[0].x, reachedPoints[0].y);
    for (let i = 1; i < reachedPoints.length; i++) {
      ctx.lineTo(reachedPoints[i].x, reachedPoints[i].y);
    }
    ctx.stroke();
  }
}

// Yavaş yukarı çıkan havai fişek sınıfı (slowFirework)
class SlowFirework {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 200; // Başlangıç olarak canvas altının biraz altında
    this.speed = 0.8 + Math.random() * 0.8; // Yavaş yukarı çıkış hızı
    this.radius = 2;
    this.alpha = 0.6;
    this.exploded = false; // Patlama kontrolü için
  }

  update(index) {
    if (!this.exploded) {
      this.y -= this.speed; // Yukarı doğru hareket

      // Yukarı çıkınca patla
      if (this.y < -this.radius) {
        this.exploded = true;
        createParticles(this.x, 0); // En üstte patlama yap
        // Patlama sonrası tekrar başa dönmek için timer koyabiliriz
        setTimeout(() => {
          this.reset();
        }, ); // 0.5 saniye sonra resetle
      }
    }
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 10;
    this.speed = 0.8 + Math.random() * 0.1;
    this.exploded = false;
  }

  draw() {
    if (!this.exploded) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(204, 102, 255, ${this.alpha})`;
      ctx.fill();
    }
    // Patlama görseli parçacıklarla olduğu için burada ekstra çizim yapmaya gerek yok.
  }
}


// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawHeartPath(); // Kalp çizgisi

  fireworks.forEach((f, i) => {
    f.update(i);
    f.draw();
  });

  particles.forEach((p, i) => {
    p.update(i);
    p.draw();
  });

  slowFireworks.forEach(sfw => {
    sfw.update();
    sfw.draw();
  });

  // Pulse efekti sadece showPulse true ise çiz
  if (showPulse) {
    for (let i = 0; i < heartPoints.length; i += 10) {  // Her 10 noktada bir çiz
      const pulse = pulseStates[i];
      const point = heartPoints[i];

      ctx.save();
      ctx.strokeStyle = `rgba(204, 102, 255, ${pulse.alpha})`; // Mor renk
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pulse büyüyüp küçülsün
      if (pulse.growing) {
        pulse.radius += 0.2;
        pulse.alpha -= 0.005;
        if (pulse.radius >= pulse.maxRadius) {
          pulse.growing = false;
        }
      } else {
        pulse.radius -= 0.2;
        pulse.alpha += 0.005;
        if (pulse.radius <= 10) {
          pulse.growing = true;
        }
      }
    }
  }

  // Yazıyı yumuşakça göster
  if (showText) {
    textAlpha += 0.01;
    if (textAlpha > 1) textAlpha = 1;

    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = "white";
    ctx.font = "bold 40px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Bonne Anniversaire", canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = "bold 30px 'Segoe UI', sans-serif";
    ctx.fillText("Je t’aime mon ti cœur", canvas.width / 2, canvas.height / 2 + 60);
    ctx.restore();
  }
}

// Kalp noktalarına göre sırayla havai fişek gönder
function launchFireworks() {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= heartPoints.length) {
      clearInterval(interval);
      // Kalp tamamlandıktan 1 saniye sonra pulse ve yazıyı göster
      setTimeout(() => {
        showPulse = true;
        showText = true;
        // Slow fireworks başlat
        for (let j = 0; j < 10; j++) {
          slowFireworks.push(new SlowFirework());
        }
      }, 1000);
      return;
    }
    const point = heartPoints[i];
    const startX = canvas.width / 2;
    const startY = canvas.height;
    fireworks.push(new Firework(startX, startY, point.x, point.y));
    i++;
  }, 100);
}

// Başlat
generateHeartPoints();
animate();
setTimeout(launchFireworks, 1000);
