'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUniversities, University } from '@/data';
import Matter from 'matter-js';

interface UniversityState {
  id: string;
  university: University;
  x: number;
  y: number;
  isPinned: boolean;
  emotion: '😊' | '💬' | '🤩';
  bodyId: number;
}

interface Conversation {
  id: string;
  uni1Id: string;
  uni2Id: string;
  message: string;
  startTime: number;
}

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
const PROXIMITY_THRESHOLD = 180;

export default function PartyLayout() {
  const [universities, setUniversities] = useState<UniversityState[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const bodiesMapRef = useRef<Map<number, string>>(new Map());
  const wanderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const universitiesRef = useRef<UniversityState[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);

  // Initialize Matter.js
  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    });
    engineRef.current = engine;

    // Create renderer (visible for mouse interactions)
    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
      },
    });
    renderRef.current = render;
    
    // Position canvas for mouse interactions but make it invisible
    render.canvas.style.position = 'absolute';
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.pointerEvents = 'auto';
    render.canvas.style.opacity = '0'; // Invisible but interactive
    render.canvas.style.zIndex = '15'; // Above avatars

    // Create boundaries (invisible walls)
    const wallThickness = 50;
    const walls = [
      // Top
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { 
        isStatic: true,
        restitution: 0.3,
      }),
      // Bottom
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { 
        isStatic: true,
        restitution: 0.3,
      }),
      // Left
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { 
        isStatic: true,
        restitution: 0.3,
      }),
      // Right
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { 
        isStatic: true,
        restitution: 0.3,
      }),
    ];
    Matter.Composite.add(engine.world, walls);

    // Create university bodies
    const allUnis = getAllUniversities();
    const margin = 150;
    const bodies: Matter.Body[] = [];
    const initialStates: UniversityState[] = [];

    allUnis.forEach((uni) => {
      const x = margin + Math.random() * (width - 2 * margin);
      const y = margin + Math.random() * (height - 2 * margin);

      const body = Matter.Bodies.circle(x, y, RADIUS, {
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.001,
        render: {
          fillStyle: COLORS[uni.rank - 1],
        },
      });

      // Set initial tiny velocity
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
      });

      bodies.push(body);
      bodiesMapRef.current.set(body.id, uni.id);

      initialStates.push({
        id: uni.id,
        university: uni,
        x: body.position.x,
        y: body.position.y,
        isPinned: false,
        emotion: '😊',
        bodyId: body.id,
      });
    });

    Matter.Composite.add(engine.world, bodies);
    setUniversities(initialStates);

    // Add mouse control for dragging
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.Composite.add(engine.world, mouseConstraint);

    // Handle clicks to pin/unpin
    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position;
      const bodies = Matter.Query.point(Matter.Composite.allBodies(engine.world), mousePosition);
      
      if (bodies.length > 0) {
        const clickedBody = bodies[0];
        if (!clickedBody.isStatic || bodiesMapRef.current.has(clickedBody.id)) {
          const uniId = bodiesMapRef.current.get(clickedBody.id);
          if (uniId) {
            // Toggle pin state
            setUniversities(prev =>
              prev.map(uni => {
                if (uni.id === uniId) {
                  const newPinState = !uni.isPinned;
                  Matter.Body.setStatic(clickedBody, newPinState);
                  if (newPinState) {
                    Matter.Body.setVelocity(clickedBody, { x: 0, y: 0 });
                  }
                  return { ...uni, isPinned: newPinState };
                }
                return uni;
              })
            );
          }
        }
      }
    });

    // Run the engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Update React state from physics bodies
    const updatePositions = () => {
      setUniversities(prev => {
        const updated = prev.map(uni => {
          const body = Matter.Composite.allBodies(engine.world).find(b => b.id === uni.bodyId);
          if (!body) return uni;

          // Limit velocity
          const maxVelocity = 3;
          const vel = body.velocity;
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
          if (speed > maxVelocity) {
            Matter.Body.setVelocity(body, {
              x: (vel.x / speed) * maxVelocity,
              y: (vel.y / speed) * maxVelocity,
            });
          }

          return {
            ...uni,
            x: body.position.x,
            y: body.position.y,
          };
        });
        
        universitiesRef.current = updated;
        return updated;
      });
    };

    // Sync positions at 60 FPS
    const syncInterval = setInterval(updatePositions, 1000 / 60);

    // Apply random wandering forces
    const applyWanderingForces = () => {
      Matter.Composite.allBodies(engine.world).forEach(body => {
        if (body.isStatic) return;

        const uniId = bodiesMapRef.current.get(body.id);
        if (!uniId) return;

        const uni = universities.find(u => u.id === uniId);
        if (uni?.isPinned) return;

        // Random force in random direction
        const angle = Math.random() * Math.PI * 2;
        const magnitude = 0.0001;
        const force = {
          x: Math.cos(angle) * magnitude,
          y: Math.sin(angle) * magnitude,
        };

        Matter.Body.applyForce(body, body.position, force);
      });
    };

    // Apply wandering forces every 2-3 seconds
    wanderIntervalRef.current = setInterval(applyWanderingForces, 2000 + Math.random() * 1000);

    // Apply attraction to similar universities
    const applyAttractionForces = () => {
      const bodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);
      
      bodies.forEach((body1) => {
        const uni1Id = bodiesMapRef.current.get(body1.id);
        if (!uni1Id) return;
        const uni1 = universities.find(u => u.id === uni1Id);
        if (!uni1 || uni1.isPinned) return;

        bodies.forEach((body2) => {
          if (body1.id === body2.id) return;

          const uni2Id = bodiesMapRef.current.get(body2.id);
          if (!uni2Id) return;
          const uni2 = universities.find(u => u.id === uni2Id);
          if (!uni2) return;

          // Check similarity
          const sameCountry = uni1.university.location.country === uni2.university.location.country;
          const similarRank = Math.abs(uni1.university.rank - uni2.university.rank) < 5;

          if (sameCountry || similarRank) {
            const dx = body2.position.x - body1.position.x;
            const dy = body2.position.y - body1.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 100 && dist < 400 && Math.random() < 0.02) {
              const magnitude = 0.00003;
              const force = {
                x: (dx / dist) * magnitude,
                y: (dy / dist) * magnitude,
              };
              Matter.Body.applyForce(body1, body1.position, force);
            }
          }
        });
      });
    };

    const attractionInterval = setInterval(applyAttractionForces, 500);

    // Cleanup
    return () => {
      clearInterval(syncInterval);
      clearInterval(attractionInterval);
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
      }
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  // Detect conversations
  useEffect(() => {
    const detectConversations = () => {
      const currentUniversities = universitiesRef.current;
      if (currentUniversities.length === 0) return;

      const newConvos: Conversation[] = [];
      const existingConvos = conversationsRef.current;

      currentUniversities.forEach((uni1, i) => {
        currentUniversities.slice(i + 1).forEach(uni2 => {
          const dx = uni1.x - uni2.x;
          const dy = uni1.y - uni2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < PROXIMITY_THRESHOLD) {
            const convoId = `${uni1.id}-${uni2.id}`;
            const existing = existingConvos.find(c => c.id === convoId);
            
            if (existing) {
              newConvos.push(existing);
            } else {
              const message = generateConversation(uni1.university, uni2.university);
              newConvos.push({
                id: convoId,
                uni1Id: uni1.id,
                uni2Id: uni2.id,
                message,
                startTime: Date.now(),
              });
            }
          }
        });
      });

      // Update conversations
      if (JSON.stringify(newConvos.map(c => c.id)) !== JSON.stringify(existingConvos.map(c => c.id))) {
        conversationsRef.current = newConvos;
        setConversations(newConvos);

        // Update emotions based on new conversations
        setUniversities(prev =>
          prev.map(uni => ({
            ...uni,
            emotion: newConvos.some(c => c.uni1Id === uni.id || c.uni2Id === uni.id) ? '💬' : '😊',
          }))
        );
      }
    };

    const interval = setInterval(detectConversations, 300);
    return () => clearInterval(interval);
  }, []);

  const generateConversation = (uni1: University, uni2: University): string => {
    const messages = [];

    // Rank comparison
    if (Math.abs(uni1.rank - uni2.rank) <= 3) {
      messages.push(`We're both top ${Math.max(uni1.rank, uni2.rank)}!`);
    } else {
      messages.push(`Rank #${uni1.rank} meets #${uni2.rank}`);
    }

    // Country comparison
    if (uni1.location.country === uni2.location.country) {
      messages.push(`${uni1.location.country} represent! 🎓`);
    } else {
      messages.push(`${uni1.location.country} × ${uni2.location.country}`);
    }

    // Major overlap
    const commonMajors = uni1.majors.filter(m1 => 
      uni2.majors.some(m2 => m1 === m2)
    );
    if (commonMajors.length > 0) {
      messages.push(`Both strong in ${commonMajors[0]}`);
    }

    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-40 w-60 h-60 bg-pink-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
        <h1 className="text-3xl font-bold text-gray-800">University Social Party 🎉</h1>
        <p className="text-sm text-gray-600 mt-1">
          {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Back button */}
      <a
        href="/"
        className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-colors border border-gray-200 text-sm font-medium shadow-sm"
      >
        ← Back
      </a>

      {/* Legend */}
      <div className="absolute top-6 right-6 z-50 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 text-xs text-gray-600 shadow-sm">
        <div>💬 Chatting</div>
        <div>😊 Wandering</div>
        <div className="mt-2 text-[10px] text-gray-500">Drag to move • Click to pin/unpin</div>
      </div>

      {/* University avatars */}
      {universities.map((uni, index) => {
        const color = COLORS[uni.university.rank - 1];
        
        return (
          <motion.div
            key={uni.id}
            onHoverStart={() => setHoveredId(uni.id)}
            onHoverEnd={() => setHoveredId(null)}
            animate={{
              x: uni.x - AVATAR_SIZE / 2,
              y: uni.y - AVATAR_SIZE / 2,
              scale: hoveredId === uni.id ? 1.1 : 1,
            }}
            transition={{
              x: { type: 'tween', duration: 0.05, ease: 'linear' },
              y: { type: 'tween', duration: 0.05, ease: 'linear' },
              scale: { type: 'spring', stiffness: 300, damping: 30 },
            }}
            className="absolute cursor-pointer z-10 pointer-events-none"
            style={{ 
              width: AVATAR_SIZE, 
              height: AVATAR_SIZE,
            }}
          >
            {/* Pin indicator */}
            {uni.isPinned && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg z-20">
                📌
              </div>
            )}

            {/* Idle animation */}
            <motion.div
              animate={{
                y: uni.emotion === '😊' ? [0, -5, 0] : 0,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Avatar circle */}
              <div
                className="w-full h-full rounded-full shadow-lg border-4 border-white flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <span className="text-3xl relative z-10">{uni.emotion}</span>
              </div>

              {/* Name label */}
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-gray-700 shadow-sm">
                  {uni.university.shortName}
                </div>
              </div>
            </motion.div>

            {/* Hover tooltip */}
            {hoveredId === uni.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-8 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs whitespace-nowrap pointer-events-none z-30 shadow-xl"
              >
                <div className="font-bold">#{uni.university.rank} - {uni.university.shortName}</div>
                <div className="text-gray-300 text-[10px]">
                  {uni.university.location.city}
                </div>
                <div className="text-gray-400 text-[10px] mt-1">
                  {uni.isPinned ? 'Click to unpin' : 'Click to pin'}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Conversation lines and bubbles */}
      <svg className="absolute inset-0 pointer-events-none z-5" style={{ width: '100%', height: '100%' }}>
        {conversations.map(convo => {
          const uni1 = universities.find(u => u.id === convo.uni1Id);
          const uni2 = universities.find(u => u.id === convo.uni2Id);
          
          if (!uni1 || !uni2) return null;

          return (
            <g key={convo.id}>
              <motion.line
                x1={uni1.x}
                y1={uni1.y}
                x2={uni2.x}
                y2={uni2.y}
                stroke="#f472b6"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                exit={{ opacity: 0 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Conversation bubbles */}
      <AnimatePresence>
        {conversations.map(convo => {
          const uni1 = universities.find(u => u.id === convo.uni1Id);
          const uni2 = universities.find(u => u.id === convo.uni2Id);
          
          if (!uni1 || !uni2) return null;

          const midX = (uni1.x + uni2.x) / 2;
          const midY = (uni1.y + uni2.y) / 2;

          return (
            <motion.div
              key={convo.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute',
                left: midX,
                top: midY - 40,
                transform: 'translate(-50%, -50%)',
              }}
              className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg text-xs font-medium text-gray-700 border border-pink-200 whitespace-nowrap pointer-events-none z-20"
            >
              {convo.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
