import { useEffect, useState } from "react";

interface Props {
  message: string;
  subMessage?: string;
}

const PARTICLES = ["⭐", "🎉", "✨", "🌟", "🎊", "💫", "🎈", "⚡"];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

export function MascotCelebration({ message, subMessage }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const ps: Particle[] = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      emoji: PARTICLES[i % PARTICLES.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random() * 1,
      size: 16 + Math.random() * 16,
    }));
    setParticles(ps);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.size,
              animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
              opacity: 0,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Bouncing mascot */}
      <div
        style={{ animation: "mascot-bounce 0.7s cubic-bezier(0.36,0.07,0.19,0.97) infinite alternate" }}
      >
        <img
          src="/mascot.png"
          alt="Mascot celebrating"
          className="w-32 h-32 drop-shadow-xl"
        />
      </div>

      {/* Message */}
      <div className="text-center z-10">
        <h2 className="text-3xl font-bold text-foreground">{message}</h2>
        {subMessage && (
          <p className="text-muted-foreground mt-1">{subMessage}</p>
        )}
      </div>

      <style>{`
        @keyframes mascot-bounce {
          from { transform: translateY(0px) rotate(-3deg) scale(1); }
          to   { transform: translateY(-18px) rotate(3deg) scale(1.05); }
        }
        @keyframes float-up {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
