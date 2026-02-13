// Advanced Coding-Themed Immersive Background
// Neural network nodes, code snippets, and interactive depth

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CodeSnippet {
  id: string;
  code: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  opacity: number;
  speed: number;
}

interface NeuralNode {
  id: string;
  x: number;
  y: number;
  z: number;
  connections: string[];
  pulsePhase: number;
}

const CodingImmersiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const codeSnippetsRef = useRef<CodeSnippet[]>([]);
  const neuralNodesRef = useRef<NeuralNode[]>([]);
  const frameRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Code snippets for floating effect
  const codeSnippetsData = [
    'const solve = (arr) => {',
    'function twoSum(nums, target)',
    'class Solution {',
    'def binary_search(arr, x):',
    'for (let i = 0; i < n; i++)',
    'if (arr[mid] === target)',
    'return result.map(x => x * 2)',
    'const dp = new Array(n).fill(0)',
    'while (left < right) {',
    'return Math.max(a, b)',
    'const graph = new Map()',
    'queue.push(node)',
    'return result.sort()',
    'if (root === null) return',
    'const memo = new Map()',
    'for (const char of s)',
    'return binary.toString(2)',
    'const [a, b] = arr',
    'throw new Error(msg)',
    'try { await fetch() }',
    'export default function',
    'import React from "react"',
    'useState(() => initialValue)',
    'useEffect(() => {}, [])',
    'const memo = useMemo(()',
    'const callback = useRef()',
    'return arr.reduce()',
    'const promise = new Promise()',
    'async function getData()',
    'const res = await response.json()',
    'if (status === 200)',
    'console.log(data)',
    'return data.filter()',
    'const unique = new Set()',
    'for (const key in obj)',
    'delete obj[key]',
    'Object.freeze(obj)',
    'Array.isArray(value)',
    'String.prototype.padStart()',
    'Number.isInteger()',
    'Math.floor(Math.random())',
    'Date.now() - startTime',
    'localStorage.setItem()',
    'sessionStorage.getItem()',
    'document.querySelector()',
    'element.addEventListener()',
    'event.preventDefault()',
    'navigator.clipboard.write()',
    'window.location.href',
    'setTimeout(callback, 1000)',
    'setInterval(repeat, 100)',
    'clearTimeout(timerId)',
    'requestAnimationFrame()',
    'Promise.all(promises)',
    'Promise.race(promises)',
    'fetch(url, options)',
    'response.headers.get()',
    'blob.text()',
    'formData.append()',
    'URLSearchParams()',
    'atob(base64String)',
    'btoa(stringToEncode)',
    'JSON.parse(jsonString)',
    'JSON.stringify(obj)',
    'encodeURIComponent(str)',
    'decodeURIComponent(encoded)',
    'Array.from(iterable)',
    'Array.of(...elements)',
    'Array.isArray(value)',
    'Array.prototype.flat()',
    'Array.prototype.flatMap()',
    'String.prototype.includes()',
    'String.prototype.startsWith()',
    'String.prototype.endsWith()',
    'String.prototype.slice()',
    'String.prototype.substring()',
    'String.prototype.replace()',
    'String.prototype.replaceAll()',
    'String.prototype.trim()',
    'String.prototype.padStart()',
    'String.prototype.padEnd()',
    'String.prototype.repeat()',
    'RegExp.prototype.test()',
    'RegExp.prototype.exec()',
    'Map.prototype.set()',
    'Map.prototype.get()',
    'Map.prototype.has()',
    'Map.prototype.delete()',
    'Map.prototype.clear()',
    'Set.prototype.add()',
    'Set.prototype.has()',
    'Set.prototype.delete()',
    'Set.prototype.clear()',
    'WeakMap.prototype.set()',
    'WeakSet.prototype.add()',
    'Proxy(target, handler)',
    'Reflect.apply()',
    'Symbol.iterator',
    'Symbol.asyncIterator',
    'Generator function*',
    'async function*',
    'yield expression',
    'yield* delegation',
    'for await...of',
    'try...catch...finally',
    'throw new Error()',
    'Error.prototype.stack',
    'AggregateError',
    'SuppressedError',
    'FinalizationRegistry',
    'WeakRef.prototype.deref()',
    'Atomics.wait()',
    'Atomics.notify()',
    'SharedArrayBuffer',
    'WebAssembly.compile()',
    'Performance.now()',
    'performance.mark()',
    'performance.measure()',
    'IntersectionObserver',
    'MutationObserver',
    'ResizeObserver',
    'WebSocket()',
    'EventSource()',
    'BroadcastChannel()',
    'MessageChannel()',
    'ServiceWorker()',
    'Cache API',
    'IndexedDB',
    'Web Workers',
    'Canvas 2D Context',
    'WebGL Context',
    'WebGL2 Context',
    'OffscreenCanvas',
    'CanvasPattern',
    'CanvasGradient',
    'ImageData',
    'createImageBitmap()',
    'requestIdleCallback()',
    'queueMicrotask()',
    'structuredClone()',
    'navigator.hardwareConcurrency',
    'navigator.deviceMemory',
    'navigator.connection',
    'navigator.geolocation',
    'navigator.mediaDevices',
    'navigator.clipboard',
    'navigator.share()',
    'screen.orientation',
    'visualViewport API',
    'CSS Custom Properties',
    'CSS Grid Layout',
    'Flexbox Layout',
    'CSS Transform',
    'CSS Animation',
    'CSS Transition',
    'Media Queries',
    'Container Queries',
    'CSS Variables',
    'calc() function',
    'min() max() clamp()',
    'CSS Houdini',
    'Paint Worklet',
    'Layout Worklet',
    'Animation Worklet',
    'Audio Worklet',
    'Web Audio API',
    'WebRTC API',
    'Gamepad API',
    'Pointer Events',
    'Touch Events',
    'Drag and Drop API',
    'File API',
    'Blob API',
    'FileReader API',
    'URL.createObjectURL()',
    'URL.revokeObjectURL()',
    'FormData API',
    'fetch() API',
    'AbortController',
    'AbortSignal',
    'Response API',
    'Request API',
    'Headers API',
    'Cache Storage API',
    'Service Worker API',
    'Push API',
    'Notification API',
    'Payment Request API',
    'Credential Management API',
    'Web Authentication API',
    'Permissions API',
    'Storage Manager API',
    'Quota Management API',
    'Background Sync API',
    'Periodic Background Sync',
    'Web Bluetooth API',
    'Web NFC API',
    'Web USB API',
    'Web Serial API',
    'WebHID API',
    'Gamepad API',
    'VR API',
    'AR API',
    'WebXR API',
    'Screen Wake Lock API',
    'Screen Orientation API',
    'Vibration API',
    'Battery API',
    'Network Information API',
    'Connection Type API',
    'Device Memory API',
    'Hardware Concurrency API',
    'WebAssembly API',
    'WebGL 2.0 API',
    'WebGPU API',
    'WebCodecs API',
    'Web Transport API',
    'Web Locks API',
    'Web Crypto API',
    'Compression Streams API',
    'Streams API',
    'Transform Streams',
    'Writable Streams',
    'Readable Streams',
    'Byte Length Queuing Strategy',
    'Count Queuing Strategy',
    'Text Encoder API',
    'Text Decoder API',
    'URL API',
    'URLSearchParams API',
    'Base64 Utilities',
    'Atomics API',
    'SharedArrayBuffer API',
    'Performance Timeline API',
    'User Timing API',
    'Navigation Timing API',
    'Paint Timing API',
    'Layout Instability API',
    'Long Tasks API',
    'First Input Delay API',
    'Largest Contentful Paint API',
    'Cumulative Layout Shift API',
    'First Contentful Paint API',
    'Time to Interactive API',
    'Core Web Vitals API'
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 1000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Create neural network nodes
    const createNeuralNetwork = () => {
      const nodes: NeuralNode[] = [];
      const nodeCount = 25;
      
      for (let i = 0; i < nodeCount; i++) {
        const connections: string[] = [];
        const connectionCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < connectionCount; j++) {
          const targetNode = Math.floor(Math.random() * nodeCount);
          if (targetNode !== i && !connections.includes(`node-${targetNode}`)) {
            connections.push(`node-${targetNode}`);
          }
        }
        
        nodes.push({
          id: `node-${i}`,
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 60,
          z: (Math.random() - 0.5) * 40,
          connections,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
      
      neuralNodesRef.current = nodes;
    };

    // Create code snippets
    const createCodeSnippets = () => {
      const snippets: CodeSnippet[] = [];
      const snippetCount = 15;
      
      for (let i = 0; i < snippetCount; i++) {
        snippets.push({
          id: `snippet-${i}`,
          code: codeSnippetsData[Math.floor(Math.random() * codeSnippetsData.length)],
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 80,
          z: (Math.random() - 0.5) * 60,
          rotation: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.002 + 0.001
        });
      }
      
      codeSnippetsRef.current = snippets;
    };

    // Create 3D grid floor
    const createGridFloor = () => {
      const gridHelper = new THREE.GridHelper(200, 50, 0x0066ff, 0x003366);
      gridHelper.position.y = -30;
      scene.add(gridHelper);
      
      // Add perspective lines
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x0066ff, 
        transparent: true, 
        opacity: 0.2 
      });
      
      for (let i = 0; i < 20; i++) {
        const points = [];
        points.push(new THREE.Vector3(-100, -30, -100 + i * 10));
        points.push(new THREE.Vector3(100, -30, -100 + i * 10));
        lineGeometry.setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        
        const points2 = [];
        points2.push(new THREE.Vector3(-100 + i * 10, -30, -100));
        points2.push(new THREE.Vector3(-100 + i * 10, -30, 100));
        lineGeometry.setFromPoints(points2);
        const line2 = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line2);
      }
    };

    // Add ambient and point lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x0066ff, 1, 100);
    pointLight1.position.set(30, 20, 30);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x9966ff, 0.8, 100);
    pointLight2.position.set(-30, 15, -20);
    scene.add(pointLight2);

    createNeuralNetwork();
    createCodeSnippets();
    createGridFloor();

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      frameRef.current++;
      
      // Update camera based on mouse
      camera.position.x += (mouseRef.current.x * 10 - camera.position.x) * 0.05;
      camera.position.y += (mouseRef.current.y * 10 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      
      // Animate neural nodes
      neuralNodesRef.current.forEach((node, index) => {
        node.pulsePhase += 0.02;
        const pulseFactor = Math.sin(node.pulsePhase) * 0.2 + 1;
        
        // Create node mesh if not exists
        if (!scene.getObjectByName(node.id)) {
          const geometry = new THREE.SphereGeometry(0.5 * pulseFactor, 16, 16);
          const material = new THREE.MeshPhongMaterial({
            color: 0x0066ff,
            emissive: 0x0066ff,
            emissiveIntensity: 0.5 * pulseFactor,
            transparent: true,
            opacity: 0.8
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(node.x, node.y, node.z);
          mesh.name = node.id;
          scene.add(mesh);
        }
        
        const mesh = scene.getObjectByName(node.id) as THREE.Mesh;
        if (mesh) {
          mesh.position.set(node.x, node.y, node.z);
          const scale = 0.5 * pulseFactor;
          mesh.scale.set(scale, scale, scale);
        }
      });
      
      // Draw connections between nodes
      neuralNodesRef.current.forEach(node => {
        node.connections.forEach(targetId => {
          const targetNode = neuralNodesRef.current.find(n => n.id === targetId);
          if (targetNode) {
            const material = new THREE.LineBasicMaterial({
              color: 0x0066ff,
              transparent: true,
              opacity: 0.3
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(node.x, node.y, node.z),
              new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z)
            ]);
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            
            // Remove old lines
            setTimeout(() => scene.remove(line), 100);
          }
        });
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000005 100%)' }}
      />
      
      {/* Binary rain effect overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="binary-rain" />
      </div>
      
      {/* Depth gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }} 
      />
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-green-400 font-mono text-sm animate-pulse">
            Initializing coding environment...
          </div>
        </div>
      )}
      
      <style jsx>{`
        .binary-rain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-image: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.03) 2px,
              rgba(0, 255, 0, 0.03) 4px
            );
          animation: binary-fall 20s linear infinite;
        }
        
        @keyframes binary-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default CodingImmersiveBackground;
