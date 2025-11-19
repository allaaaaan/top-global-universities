'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, MotionValue, useTransform } from 'framer-motion';
import { getAllUniversities, University } from '@/data';
import Matter from 'matter-js';
import { Conversation } from './types';

// --- Constants ---

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
  '#6C5B7B', '#F67280', '#355C7D', '#99B898', '#FECEAB',
  '#E8175D', '#474056', '#363636', '#CC527A', '#4B3F72',
  '#119DA4', '#19647E', '#5C80BC', '#FF8C42', '#FF3C38',
  '#A23E48', '#5E7CE2', '#FFB8D1', '#D4A5A5', '#9896F1'
];

const AVATAR_SIZE = 80;
const RADIUS = 40;
const CONNECT_THRESHOLD = 180;
const DISCONNECT_THRESHOLD = 250;

// --- Types ---

interface UniversityState {
  id: string;
  university: University;
  isPinned: boolean;
  emotion: '😊' | '💬' | '🤩';
  bodyId: number;
}

// --- Hook: Conversation Engine ---

const useConversationEngine = (
  bodiesMapRef: React.MutableRefObject<Map<number, string>>,
  engineRef: React.MutableRefObject<Matter.Engine | null>
) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pendingConversationsRef = useRef<Set<string>>(new Set());

  // Helper to generate a message (Async placeholder)
  const generateMessage = async (u1: University, u2: University, context: string[]): Promise<string> => {
    // Simulate "thinking" delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const messages = [];
    if (context.length === 0) {
      // Openers
      if (Math.abs(u1.rank - u2.rank) <= 3) messages.push(`Top ${Math.max(u1.rank, u2.rank)} club!`);
      else messages.push(`Hi #${u2.rank}, I'm #${u1.rank}`);
      if (u1.location.country === u2.location.country) messages.push(`${u1.location.country} squad!`);
    } else {
      // Follow-ups
      const commonMajor = u1.majors.find(m => u2.majors.includes(m));
      if (commonMajor) messages.push(`We both rock at ${commonMajor}!`);
      messages.push("How's the weather?");
      messages.push("Research going well?");
      messages.push("Nice campus!");
    }
    
    return messages[Math.floor(Math.random() * messages.length)] || "Hello!";
  };

  useEffect(() => {
    const checkProximity = async () => {
      if (!engineRef.current) return;

      const bodies = Matter.Composite.allBodies(engineRef.current.world).filter(b => !b.isStatic && b.label !== 'Rectangle Body');
      const activeIds = new Set<string>();
      const now = Date.now();

      // 1. Detect new or existing pairs
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const b1 = bodies[i];
          const b2 = bodies[j];
          const dx = b1.position.x - b2.position.x;
          const dy = b1.position.y - b2.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const id1 = bodiesMapRef.current.get(b1.id);
          const id2 = bodiesMapRef.current.get(b2.id);

          if (!id1 || !id2) continue;

          const convoId = [id1, id2].sort().join('-');
          const existing = conversations.find(c => c.id === convoId);
          const isPending = pendingConversationsRef.current.has(convoId);

          // Hysteresis Logic
          if (dist < CONNECT_THRESHOLD || (existing && dist < DISCONNECT_THRESHOLD)) {
            activeIds.add(convoId);

            if (!existing && !isPending) {
              // Start new conversation
              pendingConversationsRef.current.add(convoId);
              
              const u1 = getAllUniversities().find(u => u.id === id1)!;
              const u2 = getAllUniversities().find(u => u.id === id2)!;
              
              // Initial message
              generateMessage(u1, u2, []).then(text => {
                setConversations(prev => {
                  // Check if it's already added by another race (unlikely with ref but safe)
                  if (prev.some(c => c.id === convoId)) return prev;
                  return [...prev, {
                    id: convoId,
                    participants: [id1, id2],
                    messages: [{ text, senderId: id1, timestamp: Date.now() }],
                    status: 'active',
                    lastActive: Date.now()
                  }];
                });
                pendingConversationsRef.current.delete(convoId);
              });
            } else if (existing && !isPending) {
              // Update existing conversation (Dynamic flow)
              if (now - existing.lastActive > 3000) { // New message every 3s
                pendingConversationsRef.current.add(convoId);
                
                const u1 = getAllUniversities().find(u => u.id === id1)!;
                const u2 = getAllUniversities().find(u => u.id === id2)!;
                const lastSender = existing.messages[existing.messages.length - 1].senderId;
                const nextSender = lastSender === id1 ? id2 : id1;
                const senderUni = nextSender === id1 ? u1 : u2;
                const receiverUni = nextSender === id1 ? u2 : u1;

                generateMessage(senderUni, receiverUni, existing.messages.map(m => m.text)).then(text => {
                   setConversations(prev => prev.map(c => {
                    if (c.id === convoId) {
                      return {
                        ...c,
                        messages: [...c.messages, { text, senderId: nextSender, timestamp: Date.now() }],
                        lastActive: Date.now()
                      };
                    }
                    return c;
                  }));
                  pendingConversationsRef.current.delete(convoId);
                });
              }
            }
          }
        }
      }

      // 2. Cleanup ended conversations
      setConversations(prev => prev.filter(c => activeIds.has(c.id)));
    };

    const interval = setInterval(checkProximity, 500);
    return () => clearInterval(interval);
  }, [conversations]); // Re-run when conversations change to access latest state

  return conversations;
};

// --- Helper Components ---

interface AvatarProps {
  university: University;
  x: MotionValue<number>;
  y: MotionValue<number>;
  emotion: string;
  isPinned: boolean;
  color: string;
  setHoveredId: (id: string | null) => void;
  isHovered: boolean;
}

const UniversityAvatar = ({ 
  university, x, y, emotion, isPinned, color, setHoveredId, isHovered 
}: AvatarProps) => {
  const xPos = useTransform(x, value => value - AVATAR_SIZE / 2);
  const yPos = useTransform(y, value => value - AVATAR_SIZE / 2);

  return (
    <motion.div
      onHoverStart={() => setHoveredId(university.id)}
      onHoverEnd={() => setHoveredId(null)}
      style={{ x: xPos, y: yPos, width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="absolute cursor-pointer z-10 pointer-events-none will-change-transform"
    >
      <AnimatePresence>
        {isPinned && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg z-20"
          >📌</motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: emotion === '😊' ? [0, -5, 0] : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 300, damping: 30 }
        }}
        className="w-full h-full"
      >
        <div
          className="w-full h-full rounded-full shadow-lg border-4 border-white flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
          <span className="text-3xl relative z-10">{emotion}</span>
        </div>

        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-gray-700 shadow-sm">
            {university.shortName}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-full mt-8 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs whitespace-nowrap pointer-events-none z-30 shadow-xl"
          >
            <div className="font-bold">#{university.rank} - {university.shortName}</div>
            <div className="text-gray-300 text-[10px]">{university.location.city}</div>
            <div className="text-gray-400 text-[10px] mt-1">{isPinned ? 'Click to unpin' : 'Click to pin'}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ConversationVisualsProps {
  uni1X: MotionValue<number>;
  uni1Y: MotionValue<number>;
  uni2X: MotionValue<number>;
  uni2Y: MotionValue<number>;
  messages: { text: string; senderId: string }[];
}

const ConversationVisuals = ({ uni1X, uni1Y, uni2X, uni2Y, messages }: ConversationVisualsProps) => {
  const midX = useTransform([uni1X, uni2X], ([x1, x2]: number[]) => (x1 + x2) / 2);
  const midY = useTransform([uni1Y, uni2Y], ([y1, y2]: number[]) => (y1 + y2) / 2 - 40);
  const latestMessage = messages[messages.length - 1];

  return (
    <>
      <svg className="absolute inset-0 pointer-events-none z-5 overflow-visible" style={{ width: '100%', height: '100%' }}>
        <motion.line
          x1={uni1X} y1={uni1Y} x2={uni2X} y2={uni2Y}
          stroke="#f472b6" strokeWidth="2" strokeDasharray="5,5"
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        style={{
          position: 'absolute', left: 0, top: 0, x: midX, y: midY, translateX: '-50%', translateY: '-50%',
        }}
        className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg text-xs font-medium text-gray-700 border border-pink-200 whitespace-nowrap pointer-events-none z-20 max-w-[200px] truncate"
      >
        {latestMessage?.text || "..."}
      </motion.div>
    </>
  );
};

// --- Main Component ---

export default function PartyLayout() {
  const [universities, setUniversities] = useState<UniversityState[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const bodiesMapRef = useRef<Map<number, string>>(new Map());
  const motionValuesRef = useRef<Map<string, { x: MotionValue<number>; y: MotionValue<number> }>>(new Map());

  // Initialize Motion Values
  useMemo(() => {
    if (motionValuesRef.current.size === 0) {
      getAllUniversities().forEach(uni => {
        motionValuesRef.current.set(uni.id, { x: new MotionValue(0), y: new MotionValue(0) });
      });
    }
  }, []);

  // Use the Conversation Engine Hook
  const conversations = useConversationEngine(bodiesMapRef, engineRef);

  // Physics & Loop
  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engine,
      options: { width, height, wireframes: false, background: 'transparent' },
    });
    renderRef.current = render;

    render.canvas.style.position = 'absolute';
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.pointerEvents = 'auto';
    render.canvas.style.opacity = '0';
    render.canvas.style.zIndex = '15';

    const wallThickness = 500;
    const walls = [
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
    ];
    Matter.Composite.add(engine.world, walls);

    const allUnis = getAllUniversities();
    const margin = 100;
    const bodies: Matter.Body[] = [];
    const initialStates: UniversityState[] = [];

    allUnis.forEach((uni) => {
      const x = margin + Math.random() * (width - 2 * margin);
      const y = margin + Math.random() * (height - 2 * margin);

      const body = Matter.Bodies.circle(x, y, RADIUS, {
        restitution: 0.5, friction: 0.1, frictionAir: 0.02, density: 0.001,
      });

      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });

      bodies.push(body);
      bodiesMapRef.current.set(body.id, uni.id);

      const mv = motionValuesRef.current.get(uni.id);
      if (mv) { mv.x.set(x); mv.y.set(y); }

      initialStates.push({
        id: uni.id, university: uni, isPinned: false, emotion: '😊', bodyId: body.id,
      });
    });

    Matter.Composite.add(engine.world, bodies);
    setUniversities(initialStates);

    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePos = event.mouse.position;
      const clickedBodies = Matter.Query.point(bodies, mousePos);
      
      if (clickedBodies.length > 0) {
        const body = clickedBodies[0];
        const uniId = bodiesMapRef.current.get(body.id);
        if (uniId) {
          const isPinned = !body.isStatic;
          Matter.Body.setStatic(body, isPinned);
          if (isPinned) Matter.Body.setVelocity(body, { x: 0, y: 0 });
          
          setUniversities(prev => prev.map(u => u.id === uniId ? { ...u, isPinned } : u));
        }
      }
    });

    let animationFrameId: number;
    const runner = Matter.Runner.create();

    const loop = () => {
      Matter.Runner.tick(runner, engine, 1000 / 60);

      bodies.forEach(body => {
        const uniId = bodiesMapRef.current.get(body.id);
        if (uniId) {
          const mv = motionValuesRef.current.get(uniId);
          if (mv) {
            mv.x.set(body.position.x);
            mv.y.set(body.position.y);

            const maxVel = 3;
            const speed = body.speed;
            if (speed > maxVel) {
              Matter.Body.setVelocity(body, {
                x: (body.velocity.x / speed) * maxVel,
                y: (body.velocity.y / speed) * maxVel
              });
            }
          }
        }
      });

      if (Math.random() < 0.05) {
         bodies.forEach(body => {
           if (!body.isStatic && Math.random() < 0.1) {
             Matter.Body.applyForce(body, body.position, {
               x: (Math.random() - 0.5) * 0.0005,
               y: (Math.random() - 0.5) * 0.0005
             });
           }
         });
      }
      
      // Attraction Forces
      bodies.forEach(b1 => {
        if (b1.isStatic) return;
        bodies.forEach(b2 => {
          if (b1 === b2 || b2.isStatic) return;
          
          const u1 = initialStates.find(u => u.bodyId === b1.id);
          const u2 = initialStates.find(u => u.bodyId === b2.id);
          if (!u1 || !u2) return;

          const isSimilar = u1.university.location.country === u2.university.location.country 
            || Math.abs(u1.university.rank - u2.university.rank) < 5;

          if (isSimilar) {
            const dx = b2.position.x - b1.position.x;
            const dy = b2.position.y - b1.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 150 && dist < 400) {
              Matter.Body.applyForce(b1, b1.position, {
                x: dx * 0.000001,
                y: dy * 0.000001
              });
            }
          }
        });
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    Matter.Render.run(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  // Update emotions based on conversations
  useEffect(() => {
    setUniversities(prev => {
      let changed = false;
      const next = prev.map(u => {
        const isChatting = conversations.some(c => c.participants.includes(u.id));
        const currentEmotion = u.emotion;
        const targetEmotion: UniversityState['emotion'] = isChatting ? '💬' : '😊';
        
        if (currentEmotion !== targetEmotion) {
          changed = true;
          return { ...u, emotion: targetEmotion };
        }
        return u;
      });
      return changed ? next : prev;
    });
  }, [conversations]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-40 w-60 h-60 bg-pink-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
        <h1 className="text-3xl font-bold text-gray-800">University Social Party 🎉</h1>
        <p className="text-sm text-gray-600 mt-1">
          {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <a href="/" className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-colors border border-gray-200 text-sm font-medium shadow-sm">
        ← Back
      </a>

      <div className="absolute top-6 right-6 z-50 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 text-xs text-gray-600 shadow-sm pointer-events-none">
        <div>💬 Chatting</div>
        <div>😊 Wandering</div>
        <div className="mt-2 text-[10px] text-gray-500">Drag to move • Click to pin/unpin</div>
      </div>

      {universities.map((uni) => (
        <UniversityAvatar
          key={uni.id}
          university={uni.university}
          x={motionValuesRef.current.get(uni.id)!.x}
          y={motionValuesRef.current.get(uni.id)!.y}
          emotion={uni.emotion}
          isPinned={uni.isPinned}
          color={COLORS[uni.university.rank - 1]}
          setHoveredId={setHoveredId}
          isHovered={hoveredId === uni.id}
        />
      ))}

      <AnimatePresence>
        {conversations.map(convo => {
          const mv1 = motionValuesRef.current.get(convo.participants[0]);
          const mv2 = motionValuesRef.current.get(convo.participants[1]);
          
          if (!mv1 || !mv2) return null;

          return (
            <ConversationVisuals
              key={convo.id}
              uni1X={mv1.x}
              uni1Y={mv1.y}
              uni2X={mv2.x}
              uni2Y={mv2.y}
              messages={convo.messages}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
