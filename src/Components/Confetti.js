import React, { useEffect, useRef } from 'react';

const Confetti = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        const particles = [];
        const colors = ['#60a5fa', '#c084fc', '#f472b6', '#34d399', '#fbbf24'];

        // Create particles
        for(let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height - height,
                r: Math.random() * 6 + 2, // radius
                d: Math.random() * 20 + 10, // density
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }

        let animationFrameId;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p, i) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.tilt = Math.sin(p.tiltAngle - (i / 3)) * 15;

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
                ctx.stroke();

                // Reset particle if it goes off screen
                if (p.x > width + 20 || p.x < -20 || p.y > height) {
                     if( i % 3 > 0) // only respawn 66% to prevent infinite confetti stream if we want it to stop eventually? No, keep streaming for now.
                     {
                        p.x = Math.random() * width;
                        p.y = -20;
                        p.tilt = Math.floor(Math.random() * 10) - 10;
                     }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        }

        draw();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
};

export default Confetti;
