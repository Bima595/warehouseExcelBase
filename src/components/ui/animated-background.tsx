'use client';

export default function AnimatedBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/8" />
        
        {/* Moving Animated Circles - More visible with higher opacity */}
        <div 
          className="absolute h-96 w-96 rounded-full bg-primary/30 blur-3xl"
          style={{
            top: '-15%',
            right: '-15%',
            animation: 'float1 25s infinite ease-in-out',
          }}
        />
        <div 
          className="absolute h-96 w-96 rounded-full bg-primary/30 blur-3xl"
          style={{
            bottom: '-15%',
            left: '-15%',
            animation: 'float2 30s infinite ease-in-out',
          }}
        />
        <div 
          className="absolute h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-3xl"
          style={{
            top: '50%',
            left: '50%',
            animation: 'float3 35s infinite ease-in-out',
          }}
        />
        
        {/* Additional smaller circles for more depth */}
        <div 
          className="absolute h-64 w-64 rounded-full bg-primary/25 blur-2xl"
          style={{
            top: '20%',
            left: '10%',
            animation: 'float4 22s infinite ease-in-out',
          }}
        />
        <div 
          className="absolute h-64 w-64 rounded-full bg-primary/25 blur-2xl"
          style={{
            bottom: '20%',
            right: '10%',
            animation: 'float5 28s infinite ease-in-out',
          }}
        />
      </div>
      
      <style jsx global>{`
        @keyframes float1 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(120px, 150px) scale(1.2);
            opacity: 0.5;
          }
          50% {
            transform: translate(200px, 100px) scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: translate(80px, 130px) scale(1.15);
            opacity: 0.45;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
        }
        
        @keyframes float2 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(-150px, -120px) scale(1.25);
            opacity: 0.5;
          }
          50% {
            transform: translate(-100px, -180px) scale(0.85);
            opacity: 0.4;
          }
          75% {
            transform: translate(-60px, -140px) scale(1.15);
            opacity: 0.45;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
        }
        
        @keyframes float3 {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          33% {
            transform: translate(-40%, -60%) scale(1.3) rotate(120deg);
            opacity: 0.35;
          }
          66% {
            transform: translate(-60%, -40%) scale(0.8) rotate(240deg);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 0.3;
          }
        }
        
        @keyframes float4 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(100px, -80px) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
        }
        
        @keyframes float5 {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(-100px, 80px) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
        }
      `}</style>
    </>
  );
}
