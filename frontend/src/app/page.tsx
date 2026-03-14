"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Server, Activity, Wrench, Award, Database, Mail, BookOpen, BrainCircuit, Shield, Github } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const EDUNOVA_QUOTES = [
    {
        quote: "Uploading my entire 300-page organic chemistry textbook as a PDF and having the Tutor Engine cite exact paragraphs saved my finals.",
        author: "Sarah Chen, Medical Student"
    },
    {
        quote: "I appreciate the local privacy approach. Running the Qwen 3B model means I can study my proprietary lab research locally without leaks.",
        author: "Dr. Marcus Vance, Research Fellow"
    },
    {
        quote: "The Retrieval Pipeline is incredibly fast. Instantly indexing a semester's worth of slides and getting hallucination-free answers.",
        author: "Elena Rodriguez, CS Undergrad"
    },
    {
        quote: "Finally, an AI that explicitly says 'I don't know' instead of hallucinating when the answer isn't in my uploaded documents. Absolute game changer.",
        author: "James T., Law Student"
    }
];

export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const quotesRef = useRef<HTMLDivElement>(null);
    const quotesSectionRef = useRef<HTMLElement>(null);
    const [navScrolled, setNavScrolled] = useState(false);

    // Framer Motion Scroll Hook for Quotes
    const { scrollYProgress } = useScroll({
        target: quotesSectionRef,
        offset: ["start end", "end start"]
    });

    const quotesX = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    const scrollQuotes = (direction: 'left' | 'right') => {
        if (quotesRef.current) {
            const scrollAmount = window.innerWidth > 1024 ? 800 : window.innerWidth * 0.85;
            quotesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        // 1. Observer for Scroll Animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const domObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.animate-enter');
        elements.forEach((element) => {
            domObserver.observe(element);
        });

        // 2. Navbar Scroll Logic
        const handleScroll = () => {
            if (window.scrollY > 50) setNavScrolled(true);
            else setNavScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);

        // 3. Canvas Scroll-Driven Animation System
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        let particles: Particle[] = [];
        let scrollProgress = 0;
        let targetScrollProgress = 0;

        const config = {
            particleCount: 180,
            baseSpeed: 0.2,
            colors: ['rgba(255,255,255,0.8)', 'rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.4)'], // Blue & Emerald accents
            connectionDistance: 120,
            mouseParallaxStrength: 0.5
        };

        let mouse = { x: 0, y: 0 };
        let smoothedMouse = { x: 0, y: 0 };

        class Particle {
            x!: number; y!: number; z!: number; size!: number; vx!: number; vy!: number; color!: string;
            constructor() {
                this.reset();
                this.x = (Math.random() - 0.5) * width * 1.5;
                this.y = (Math.random() - 0.5) * height * 1.5;
                this.z = Math.random() * 2000;
            }

            reset() {
                this.x = (Math.random() - 0.5) * width;
                this.y = (Math.random() - 0.5) * height;
                this.z = 2000;
                this.size = Math.random() * 2 + 0.5;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            }

            update(progress: number) {
                let spreadFactor = 1;
                let zSpeed = 2;

                if (progress < 0.2) {
                    spreadFactor = 0.8;
                    zSpeed = 1;
                } else if (progress < 0.5) {
                    spreadFactor = 1 + (progress - 0.2) * 2;
                    zSpeed = 10;
                } else if (progress < 0.75) {
                    spreadFactor = 2.5;
                    zSpeed = 5;
                } else {
                    spreadFactor = 3;
                    zSpeed = 0.5;
                }

                this.z -= zSpeed;

                if (this.z <= 1) {
                    this.z = 2000;
                    this.x = (Math.random() - 0.5) * width * spreadFactor;
                    this.y = (Math.random() - 0.5) * height * spreadFactor;
                }

                this.x += this.vx;
                this.y += this.vy;

                if (progress < 0.2) {
                    this.x += (smoothedMouse.x * config.mouseParallaxStrength) / (this.z * 0.01);
                    this.y += (smoothedMouse.y * config.mouseParallaxStrength) / (this.z * 0.01);
                }
            }
        }

        const initCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            particles = [];
            for (let i = 0; i < config.particleCount; i++) {
                particles.push(new Particle());
            }
        };

        let animationFrameId: number;
        const animate = () => {
            const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            targetScrollProgress = Math.min(1, Math.max(0, window.scrollY / docHeight));

            scrollProgress += (targetScrollProgress - scrollProgress) * 0.05;

            smoothedMouse.x += (mouse.x - smoothedMouse.x) * 0.05;
            smoothedMouse.y += (mouse.y - smoothedMouse.y) * 0.05;

            if (ctx) ctx.clearRect(0, 0, width, height);

            const vanishingY = height / 2 - (scrollProgress * 200);

            let points: any[] = [];

            particles.forEach(p => {
                p.update(scrollProgress);

                const perspective = 800;
                const scale = perspective / (perspective + p.z);
                const screenX = width / 2 + p.x * scale;
                const screenY = vanishingY + p.y * scale;

                const alpha = Math.min(1, (2000 - p.z) / 500) * scale;

                if (p.z > 0 && screenX > 0 && screenX < width && screenY > 0 && screenY < height && ctx) {
                    ctx.beginPath();
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = alpha * (1 - scrollProgress * 0.5);
                    ctx.arc(screenX, screenY, p.size * scale, 0, Math.PI * 2);
                    ctx.fill();

                    if (p.z < 1500) {
                        points.push({ x: screenX, y: screenY, alpha: alpha });
                    }
                }
            });

            const maxDist = config.connectionDistance * (1 - scrollProgress * 0.3);

            if (ctx) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 0.5;

                for (let i = 0; i < points.length; i++) {
                    for (let j = i + 1; j < points.length; j++) {
                        const dx = points[i].x - points[j].x;
                        const dy = points[i].y - points[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < maxDist) {
                            ctx.beginPath();
                            ctx.moveTo(points[i].x, points[i].y);
                            ctx.lineTo(points[j].x, points[j].y);
                            ctx.globalAlpha = Math.min(points[i].alpha, points[j].alpha) * (1 - dist / maxDist);
                            ctx.stroke();
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = (e.clientX / width) * 2 - 1;
            mouse.y = (e.clientY / height) * 2 - 1;
        };

        window.addEventListener('resize', initCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        initCanvas();
        animate();

        return () => {
            elements.forEach((element) => domObserver.unobserve(element));
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', initCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col selection:bg-blue-500 selection:text-white relative">
            {/* Background Layer Group */}
            <div className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden">
                {/* Canvas for Scroll-Driven Animation */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60"></canvas>

                {/* Texture Overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/30 via-[#050505]/80 to-[#050505] pointer-events-none"></div>
                <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" style={{ maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" }}></div>
            </div>

            {/* Navbar */}
            <nav className={`lg:px-12 flex fixed transition-all duration-500 z-50 text-white mix-blend-difference w-full pt-8 pr-6 pb-8 pl-6 top-0 items-center justify-between ${navScrolled ? 'backdrop-blur-md bg-black/50 border-b border-white/5 pt-4 pb-4' : ''}`}>
                {/* Logo */}
                <Link href="/" className="flex flex-col group">
                    <span className="leading-none uppercase group-hover:opacity-80 transition-opacity text-2xl font-semibold tracking-tight font-display">EduNova</span>
                    <span className="leading-none uppercase group-hover:text-white transition-colors text-xs font-light text-neutral-400 tracking-[0.25em] font-display mt-1">AI Tutor</span>
                </Link>

                {/* Centered Links */}
                <div className="hidden md:flex items-center gap-10 text-sm font-light uppercase tracking-widest text-neutral-400 absolute left-1/2 -translate-x-1/2">
                    <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
                    <a href="#pipeline" className="hover:text-white transition-colors duration-300">Architecture</a>
                    <a href="#stack" className="hover:text-white transition-colors duration-300">Tech Stack</a>
                </div>

                {/* Action */}
                <div className="flex items-center gap-6">
                    <Link href="/login" className="hidden sm:inline-flex uppercase text-sm font-light text-neutral-400 tracking-widest hover:text-white transition-colors">Log In</Link>
                    <Link href="/signup" className="flex items-center gap-4 group cursor-pointer">
                        <span className="uppercase text-sm font-medium tracking-widest text-white border border-white/20 px-4 py-2 rounded-sm group-hover:bg-blue-500 group-hover:border-blue-500 transition-all duration-300">Sign Up</span>
                    </Link>
                </div>
            </nav>

            {/* Main Hero Section */}
            <main className="flex-grow flex min-h-screen pt-20 relative items-center justify-center">

                {/* Connecting Noodles */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-20 mix-blend-screen">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0,600 C300,600 300,300 600,300 S900,600 1200,600" fill="none" stroke="url(#grad1)" strokeWidth="1" className="noodle-path"></path>
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "rgba(255,255,255,0)", stopOpacity: 0 }}></stop>
                                <stop offset="50%" style={{ stopColor: "rgba(59, 130, 246, 0.5)", stopOpacity: 1 }}></stop>
                                <stop offset="100%" style={{ stopColor: "rgba(255,255,255,0)", stopOpacity: 0 }}></stop>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full h-full">

                    {/* Left Column: Content */}
                    <div className="flex flex-col justify-center max-w-2xl">
                        {/* Tag */}
                        <div className="flex items-center gap-3 mb-8 animate-enter visible">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
                            <span className="uppercase text-xs font-normal text-neutral-400 tracking-[0.2em] font-mono">Local Open-Source AI Tutor</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl lg:text-7xl leading-[1.05] font-display font-medium tracking-tight text-white mb-8 capitalize animate-enter delay-100 visible">
                            Your Personal<br />
                            AI Study<br />
                            Companion<br />
                        </h1>

                        {/* Subtext */}
                        <p className="text-xl text-neutral-400 max-w-md leading-relaxed mb-10 font-light animate-enter delay-200 visible">
                            Upload your course materials and let EduNova ground its answers in your specific notes. Faster learning, zero hallucinations, fully private.
                        </p>

                        {/* Button */}
                        <div className="flex items-start animate-enter delay-300 visible">
                            <Link href="/signup" className="btn-hover-effect group inline-flex items-center gap-4 px-8 py-4 border border-white/20 rounded-sm text-white bg-transparent uppercase text-sm font-medium tracking-widest hover:border-blue-500 hover:bg-blue-500">
                                Start Learning
                                <ArrowRight className="w-4 h-4 transition-transform duration-300" strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Visual Composition */}
                    <div className="flex animate-enter delay-200 w-full h-[600px] relative items-center justify-center visible">

                        {/* SVG Container for Beam Noodles */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 600 600">
                            <defs>
                                <linearGradient id="beamGrad" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#FACC15" stopOpacity="0"></stop>
                                    <stop offset="50%" stopColor="#FACC15" stopOpacity="1"></stop>
                                    <stop offset="100%" stopColor="#FACC15" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>

                            <path d="M180,180 Q250,250 300,300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"></path>
                            <path d="M180,180 Q250,250 300,300" fill="none" stroke="url(#beamGrad)" strokeWidth="1" className="beam-path"></path>

                            <path d="M150,450 Q220,400 300,300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"></path>
                            <path d="M150,450 Q220,400 300,300" fill="none" stroke="url(#beamGrad)" strokeWidth="1" className="beam-path" style={{ animationDelay: '1s' }}></path>

                            <path d="M480,480 Q400,400 300,300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"></path>
                            <path d="M480,480 Q400,400 300,300" fill="none" stroke="url(#beamGrad)" strokeWidth="1" className="beam-path" style={{ animationDelay: '2s' }}></path>
                        </svg>

                        {/* Central "Knot" Shape */}
                        <div className="relative w-[380px] h-[380px] knot-spin opacity-90 mix-blend-screen">
                            <svg viewBox="0 0 200 200" className="w-[380px] h-[380px] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" strokeWidth="2" style={{ color: "rgb(229, 229, 229)" }}>
                                <g stroke="white" strokeWidth="0.3" fill="none" opacity="0.8">
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(0 100 100)"></ellipse>
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(30 100 100)"></ellipse>
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(60 100 100)"></ellipse>
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(90 100 100)"></ellipse>
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(120 100 100)"></ellipse>
                                    <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(150 100 100)"></ellipse>

                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(15 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(45 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(75 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(105 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(135 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                    <ellipse cx="100" cy="100" rx="75" ry="25" transform="rotate(165 100 100)" strokeDasharray="2 2" opacity="0.5"></ellipse>
                                </g>
                            </svg>
                        </div>

                        {/* Floating Elements (Replaced Texts per instructions) */}
                        <div className="absolute top-1/4 left-0 -translate-x-4 flex flex-col items-center gap-2 animate-enter delay-300 visible">
                            <div className="relative w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                                <svg className="absolute w-full h-full rotate-45" viewBox="0 0 40 40">
                                    <path d="M20,5 L20,35" stroke="white" strokeWidth="0.5" markerEnd="url(#arrow)"></path>
                                </svg>
                            </div>
                            <span className="font-math text-xl text-neutral-300">print("hello world")</span>
                        </div>

                        <div className="absolute bottom-1/4 left-10 translate-y-8 animate-enter delay-400 visible">
                            <span className="text-4xl text-neutral-200 tracking-wide font-math" style={{ textShadow: "0 0 20px rgba(0,0,0,1)" }}>
                                E = mc²
                            </span>
                        </div>

                        {/* The Little Curve on the Right */}
                        <div className="absolute bottom-0 right-0 w-32 h-20 animate-enter delay-500 visible">
                            <svg viewBox="0 0 100 60" className="w-full h-full stroke-white/80 fill-none" strokeWidth="1">
                                <path d="M5,55 L95,55" strokeOpacity="0.5"></path>
                                <path d="M50,55 L50,10" strokeOpacity="0.5"></path>
                                <path d="M10,55 C30,55 40,15 50,15 S70,55 90,55"></path>
                            </svg>
                        </div>

                        <div className="absolute -bottom-8 -right-8 text-neutral-500 animate-pulse">
                            <Database className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Quotes Carousel Section */}
            <section ref={quotesSectionRef} className="bg-[#050505] py-24 border-t border-b border-white/5 overflow-hidden flex flex-col justify-center relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

                <div className="px-6 lg:px-12 flex items-center justify-end mb-16 gap-4 max-w-7xl mx-auto z-20 relative w-full">
                     <button onClick={() => scrollQuotes('left')} className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer group hover:scale-105 active:scale-95 text-white">
                         <ArrowLeft className="w-5 h-5 transition-colors" strokeWidth={1.5} />
                     </button>
                     <button onClick={() => scrollQuotes('right')} className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer group hover:scale-105 active:scale-95 text-white">
                         <ArrowRight className="w-5 h-5 transition-colors" strokeWidth={1.5} />
                     </button>
                </div>

                <motion.div style={{ x: quotesX }} ref={quotesRef} className="flex gap-12 lg:gap-32 px-6 lg:px-[15vw] items-center overflow-visible w-max relative z-20 pb-8 cursor-grab active:cursor-grabbing">
                    {EDUNOVA_QUOTES.map((q, i) => (
                        <div key={i} className="flex-shrink-0 w-[85vw] lg:w-[700px] px-4 md:px-8 border-l border-white/10 group transition-all duration-500 hover:border-blue-500">
                            <p className="font-display text-2xl lg:text-3xl font-light text-neutral-400 group-hover:text-white leading-relaxed mb-6 transition-colors duration-500">
                                "{q.quote}"
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-neutral-500 text-sm font-mono tracking-widest uppercase group-hover:text-neutral-300 transition-colors duration-500">{q.author}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="overflow-hidden bg-[#050505] pt-24 pb-24 relative" id="features">
                {/* Connecting Line from Hero */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-px bg-gradient-to-b from-white/20 to-transparent"></div>

                <div className="px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 animate-enter mb-20 gap-x-8 gap-y-8 items-end justify-between">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-display font-medium text-white tracking-tight mb-4">
                                Features<br />
                                <span className="text-neutral-600">&amp; Mechanisms</span>
                            </h2>
                            <p className="text-base text-neutral-400 font-light max-w-md">
                                An end-to-end platform bridging state of the art RAG with local large language models.
                            </p>
                        </div>
                        {/* Badge */}
                        <div className="flex items-center gap-2 border border-blue-500/40 bg-blue-500/5 rounded-full px-4 py-2">
                            <Award className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                            <span className="text-xs uppercase font-medium tracking-widest text-blue-500">100% Hackathon Ready</span>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-100">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <div className="flex justify-between items-start mb-12">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:text-blue-500 transition-colors">
                                    <BookOpen className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-xl font-display font-normal text-white mb-2">1. Upload Materials</h3>
                            <p className="text-base text-neutral-500 font-light leading-relaxed mb-6">
                                Drop your class PDFs, slides, and notes into your private knowledge base. We process them instantly with PyMuPDF.
                            </p>

                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                                <span>Data Core</span>
                                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-200">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <div className="flex justify-between items-start mb-12">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:text-blue-500 transition-colors">
                                    <BrainCircuit className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-xl font-display font-normal text-white mb-2">2. Ask Questions</h3>
                            <p className="text-base text-neutral-500 font-light leading-relaxed mb-6">
                                Chat with our fine-tuned Qwen2.5 local model. It acts as an expert tutor that understands your exact curriculum.
                            </p>

                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                                <span>Inference</span>
                                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-300">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <div className="flex justify-between items-start mb-12">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:text-blue-500 transition-colors">
                                    <Shield className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-xl font-display font-normal text-white mb-2">3. Grounded Answers</h3>
                            <p className="text-base text-neutral-500 font-light leading-relaxed mb-6">
                                No generic advice. Every answer is retrieved specifically from your uploaded chunks, reducing AI hallucinations entirely.
                            </p>

                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                                <span>Safety</span>
                                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Experience Section (App Architecture) */}
            <section className="bg-[#050505] pt-24 pb-24 relative" id="pipeline">
                <div className="lg:px-12 z-10 max-w-7xl mr-auto ml-auto pr-6 pl-6 relative">
                    {/* Header Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-16 items-end">
                        <div className="flex flex-col gap-6 animate-enter gap-x-6 gap-y-6">
                            <div className="inline-flex items-center gap-2">
                                <span className="text-xs font-mono text-blue-500 uppercase tracking-[0.2em] border border-blue-500/20 px-2 py-1 rounded">Architecture</span>
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-display font-normal text-white tracking-tight leading-[0.9]">
                                Distributed<br />
                                <span className="text-neutral-600">AI Pipeline</span>
                            </h2>
                        </div>

                        <div className="flex flex-col gap-6 animate-enter delay-100">
                            <p className="leading-relaxed text-xl font-light text-neutral-400">
                                Built with 3 independent microservices communicating seamlessly. <span className="text-white font-normal">Fast, secure, local.</span>
                            </p>
                        </div>
                    </div>

                    {/* Experience Blocks Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Block 01: Retrieval */}
                        <div className="group relative bg-[#080808] border border-white/10 p-8 flex flex-col justify-between min-h-[380px] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 animate-enter delay-100">
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-end items-start mb-4">
                                    <span className="text-sm font-medium uppercase tracking-widest text-white group-hover:text-emerald-400 transition-colors duration-500">Service 01</span>
                                </div>
                                <h3 className="text-2xl text-white font-normal mb-3 group-hover:text-emerald-300 transition-colors duration-300">Retrieval Pipeline</h3>

                                <ul className="list-disc list-inside space-y-2 mt-4 text-base font-light text-neutral-400 group-hover:text-gray-300 transition-colors duration-500 flex-grow">
                                    <li>FastAPI service dedicated to indexing and embedding.</li>
                                    <li>Extracts text using PyMuPDF and SentenceTransformers.</li>
                                    <li>Stores vectorized chunks actively into ChromaDB.</li>
                                    <li className="pt-2"><span className="font-normal">Env:</span> FastAPI, ChromaDB, PyMuPDF.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Block 02: Tutor Engine */}
                        <div className="group relative bg-[#080808] border border-white/10 p-8 flex flex-col justify-between min-h-[380px] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 animate-enter delay-200">
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-end items-start mb-4">
                                    <span className="text-sm font-medium uppercase tracking-widest text-white group-hover:text-emerald-400 transition-colors duration-500">Service 02</span>
                                </div>
                                <h3 className="group-hover:text-emerald-300 transition-colors duration-300 text-2xl font-normal text-white mb-3">Tutor Engine (LLM)</h3>

                                <ul className="list-disc list-inside space-y-2 mt-4 text-base font-light text-neutral-400 group-hover:text-gray-300 transition-colors duration-500 flex-grow">
                                    <li>FastAPI service interfacing with Ollama endpoints.</li>
                                    <li>Calls retrieval pipeline to augment prompts.</li>
                                    <li>Generates responses strictly grounded in context.</li>
                                    <li className="pt-2"><span className="font-normal">Env:</span> FastAPI, Qwen2.5:3B, Ollama, Langchain.</li>
                                </ul>
                            </div>
                        </div>

                    </div>

                    {/* Block 03: Fullstack */}
                    <div className="group flex flex-col md:flex-row gap-8 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-500 animate-enter delay-300 w-full border-white/20 border rounded-sm p-8 relative items-center">
                        <div className="relative z-10 flex-grow text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-2">
                                <div>
                                    <h3 className="group-hover:text-white transition-colors duration-300 text-2xl font-normal text-white">Fullstack Proxies & Connectors</h3>
                                </div>
                            </div>
                            <p className="text-base text-neutral-400 leading-relaxed font-light group-hover:text-gray-300 max-w-3xl transition-colors duration-500 mt-2">
                                A central proxy FastAPI App Backend tracking Supabase PostgreSQL states. A premium React/Next.js client interface with optimistic UI updates binding the user securely to the local APIs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stack Section */}
            <section className="overflow-hidden bg-[#050505] pt-12 pb-24 relative" id="stack">
                <div className="px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-display font-medium text-white tracking-tight mb-12 animate-enter">
                        Powered by <br />
                        <span className="text-neutral-600">Open Source</span>
                    </h2>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cert 1 */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-100">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <h3 className="text-lg font-display font-normal text-white mb-2">Qwen 2.5 : 3B Parameters</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs border border-white/10 px-2 py-1 text-neutral-500">Ollama</span>
                                <span className="text-xs border border-white/10 px-2 py-1 text-neutral-500">Alibaba</span>
                            </div>
                            <p className="text-base text-neutral-500 font-light leading-relaxed">
                                Small enough to run locally without a powerful GPU constraints. Smart enough to follow complex retrieval structures and educational reasoning.
                            </p>
                        </div>

                        {/* Cert 2 */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-200">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <h3 className="text-lg font-display font-normal text-white mb-2">Supabase PostgreSQL</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs border border-white/10 px-2 py-1 text-neutral-500">Supabase</span>
                                <span className="text-xs border border-white/10 px-2 py-1 text-neutral-500">JWT Auth</span>
                            </div>
                            <p className="text-base text-neutral-500 font-light leading-relaxed">
                                Robust database schema mapping documents to users, tracking chunk statuses, and persisting AI chat threads safely across boundaries.
                            </p>
                        </div>

                        {/* Languages & Interests */}
                        <div className="group relative bg-[#0A0A0A] border border-white/10 p-8 hover:border-blue-500/40 transition-all duration-500 animate-enter delay-300">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <h3 className="text-lg font-display font-normal text-white mb-4">React & FastAPI Core</h3>
                            <ul className="space-y-4">
                                <li className="border-l-2 border-neutral-800 pl-4">
                                    <div className="text-white text-base font-normal">FastAPI (Python)</div>
                                    <div className="text-neutral-500 text-sm font-light mt-1">Lightweight async proxy architecture forwarding uploads over httpx safely.</div>
                                </li>
                                <li className="border-l-2 border-neutral-800 pl-4">
                                    <div className="text-white text-base font-normal">Next.js & Tailwind</div>
                                    <div className="text-neutral-500 text-sm font-light mt-1">Ultra thick UX wrapping, protecting, and animating the user journey.</div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-[#050505] pt-24 pb-24 relative border-t border-white/5" id="contact">
                <div className="px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div className="flex flex-col gap-6 animate-enter">
                            <h2 className="text-4xl lg:text-5xl font-display font-medium text-white tracking-tight">
                                Get in <span className="text-blue-500">Touch</span>
                            </h2>
                            <p className="text-base text-neutral-400 font-light max-w-md leading-relaxed mb-8">
                                Have questions about our local AI architecture? Want to deploy EduNova at your institution? Drop us a line.
                            </p>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4 text-neutral-300 hover:text-white transition-colors">
                                    <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-full">
                                        <Mail className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono mb-1">Email Us</div>
                                        <div className="text-sm font-medium">hello@edunova.ai</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form className="bg-[#0A0A0A] border border-white/10 p-8 flex flex-col gap-6 animate-enter delay-200 w-full relative group hover:border-blue-500/30 transition-colors duration-500">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs uppercase tracking-widest text-neutral-500 font-mono">First Name</label>
                                    <input type="text" className="bg-transparent border-b border-white/10 pb-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700" placeholder="John" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Last Name</label>
                                    <input type="text" className="bg-transparent border-b border-white/10 pb-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700" placeholder="Doe" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Email Address</label>
                                <input type="email" className="bg-transparent border-b border-white/10 pb-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700" placeholder="john@university.edu" />
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Message</label>
                                <textarea className="bg-transparent border-b border-white/10 pb-2 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700 resize-none h-24" placeholder="How can we help?"></textarea>
                            </div>

                            <button type="button" className="btn-hover-effect bg-white text-black text-sm uppercase tracking-widest font-medium py-4 px-8 self-end transition-all">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="overflow-hidden bg-[#050505] w-full border-white/10 border-t pt-16 pb-8 relative">
                <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>
                <div className="lg:px-12 z-10 w-full pr-6 pl-6 relative">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-12">
                        <div className="md:col-span-4 lg:col-span-5 flex flex-col gap-6 gap-x-6 gap-y-6">
                            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                <div className="flex flex-col justify-center">
                                    <span className="font-display font-semibold text-2xl leading-none tracking-tight text-white uppercase">EduNova</span>
                                    <span className="font-display font-normal text-xs leading-none tracking-[0.25em] text-neutral-400 mt-1 uppercase">Tutor</span>
                                </div>
                            </Link>
                            <p className="text-neutral-500 text-base leading-relaxed max-w-xs font-light">
                                Hacking education with local AI. Built by students, for students.
                            </p>
                        </div>
                        <div className="md:col-span-4 lg:col-span-3 flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-mono text-white uppercase tracking-widest mb-6">EduNova Team</h4>
                                <div className="flex flex-col gap-2 text-base text-neutral-400 mb-6 gap-x-2 gap-y-2">
                                    <span className="hover:text-blue-500 transition-colors">Core System Pipeline</span>
                                    <span className="hover:text-blue-500 transition-colors">LLM Tutor Engine</span>
                                    <span className="hover:text-blue-500 transition-colors">Application Development</span>
                                    <span>Hackathon 2026</span>
                                </div>
                                <div className="flex gap-4">
                                    <a href="https://github.com/edunova" className="w-10 h-10 border border-white/10 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black hover:border-white transition-all duration-300">
                                        <Github className="w-4 h-4" strokeWidth={1.5} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 border-white/10 border-t pt-6 gap-x-4 gap-y-4 items-center justify-between">
                        <p className="text-sm text-neutral-600 font-mono">© 2026 EduNova Platform. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span className="text-sm text-neutral-600">Local Privacy First</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
