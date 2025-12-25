import { gsap } from 'gsap';

/**
 * Victory animation using GSAP
 * Creates celebratory effects when game completes
 */
export class VictoryAnimation {
  private timeline: gsap.core.Timeline | null = null;

  /**
   * Play the victory animation sequence
   */
  play(): void {
    // Kill any existing animation
    if (this.timeline) {
      this.timeline.kill();
    }

    const overlay = document.querySelector('#gameComplete');
    const content = document.querySelector('.complete-content');
    const trophy = document.querySelector('.trophy');
    const title = document.querySelector('.complete-title');
    const winnerDisplay = document.querySelector('.winner-display');
    const winnerName = document.querySelector('.winner-name');
    const button = document.querySelector('.complete-btn');

    if (!overlay || !content) return;

    // Reset states
    gsap.set([content, trophy, title, winnerDisplay, button], {
      opacity: 0,
      scale: 0.8,
      y: 20,
    });
    gsap.set(trophy, { rotation: -30, scale: 0.5 });

    // Create timeline
    this.timeline = gsap.timeline({
      defaults: { ease: 'back.out(1.7)' }
    });

    // Animate sequence
    this.timeline
      // Content container fades in
      .to(content, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
      // Trophy bounces in with rotation
      .to(trophy, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      }, '-=0.2')
      // Trophy pulse effect
      .to(trophy, {
        scale: 1.2,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      })
      // Title slides in
      .to(title, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
      }, '-=0.3')
      // Winner display slides up
      .to(winnerDisplay, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
      }, '-=0.1')
      // Winner name highlight effect
      .fromTo(winnerName, {
        backgroundSize: '0% 100%',
      }, {
        backgroundSize: '100% 100%',
        duration: 0.5,
        ease: 'power2.out',
      }, '-=0.2')
      // Button fades in
      .to(button, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
      }, '-=0.2');

    // Add floating animation to trophy
    gsap.to(trophy, {
      y: -5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1,
    });
  }

  /**
   * Hide animation
   */
  hide(): void {
    const content = document.querySelector('.complete-content');
    if (!content) return;

    gsap.to(content, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      ease: 'power2.in',
    });
  }

  /**
   * Create confetti burst effect
   */
  confetti(): void {
    const overlay = document.querySelector('#gameComplete');
    if (!overlay) return;

    const colors = ['#fbbf24', '#f59e0b', '#0ea5e9', '#22c55e', '#ef4444', '#a855f7'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        left: 50%;
        top: 50%;
        pointer-events: none;
      `;
      overlay.appendChild(confetti);

      const angle = (Math.PI * 2 * i) / confettiCount;
      const velocity = 200 + Math.random() * 200;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      gsap.to(confetti, {
        x: vx,
        y: vy + 300, // gravity effect
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 1.5 + Math.random(),
        ease: 'power2.out',
        onComplete: () => confetti.remove(),
      });
    }
  }
}

export const victoryAnimation = new VictoryAnimation();
