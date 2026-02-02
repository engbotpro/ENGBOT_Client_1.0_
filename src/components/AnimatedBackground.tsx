import React, { useEffect, useRef } from "react";
import image from "../assets/mapaMundo.png";

interface Coordinate {
  x: number;
  y: number;
}

interface Point extends Coordinate {
  originX: number;
  originY: number;
  closest?: Point[];
  active?: number;
  circle?: Circle;
}

class Circle {
  pos: Point;
  radius: number;
  color: string;
  active: number;

  constructor(pos: Point, rad: number, color: string) {
    this.pos = pos;
    this.radius = rad;
    this.color = color;
    this.active = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = `rgba(156,217,249,${this.active})`;
    ctx.fill();
  }
}

const AnimatedBackground = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const largeHeader = headerRef.current;
    const canvas = canvasRef.current;
    if (!largeHeader || !canvas) return;

    // Define a altura do header
    largeHeader.style.height = height + "px";

    // Configura o canvas
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: Point[] = [];
    // Definindo target com base na interface Coordinate
    const target: Coordinate = { x: width / 2, y: height / 2 };
    let animateHeader = true;

    // Função para criar os pontos
    const initHeader = () => {
      points = [];
      for (let x = 0; x < width; x += width / 20) {
        for (let y = 0; y < height; y += height / 20) {
          const px = x + Math.random() * (width / 20);
          const py = y + Math.random() * (height / 20);
          const p: Point = { x: px, originX: px, y: py, originY: py };
          points.push(p);
        }
      }

      // Para cada ponto, encontra os 5 mais próximos
      points.forEach(p1 => {
        const closest: Point[] = [];
        points.forEach(p2 => {
          if (p1 !== p2) {
            if (closest.length < 5) {
              closest.push(p2);
            } else {
              for (let i = 0; i < 5; i++) {
                if (getDistance(p1, p2) < getDistance(p1, closest[i])) {
                  closest[i] = p2;
                  break;
                }
              }
            }
          }
        });
        p1.closest = closest;
        // Adiciona um círculo ao ponto
        p1.circle = new Circle(p1, 2 + Math.random() * 2, "rgba(255,255,255,0.3)");
      });
    };

    // Função utilitária para calcular a distância entre duas coordenadas
    const getDistance = (p1: Coordinate, p2: Coordinate) => {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    };

    // Animação dos pontos
    const animate = () => {
      if (animateHeader) {
        ctx.clearRect(0, 0, width, height);
        points.forEach(p => {
          // Define a atividade dos pontos com base na distância do cursor
          const d = Math.abs(getDistance(target, p));
          if (d < 4000) {
            p.active = 0.3;
            if (p.circle) p.circle.active = 0.6;
          } else if (d < 20000) {
            p.active = 0.1;
            if (p.circle) p.circle.active = 0.3;
          } else if (d < 40000) {
            p.active = 0.02;
            if (p.circle) p.circle.active = 0.1;
          } else {
            p.active = 0;
            if (p.circle) p.circle.active = 0;
          }
          drawLines(p);
          p.circle?.draw(ctx);
        });
      }
      requestAnimationFrame(animate);
    };

    // Desenha as linhas entre os pontos
    const drawLines = (p: Point) => {
      if (!p.active || !p.closest) return;
      p.closest.forEach(cp => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(cp.x, cp.y);
        ctx.strokeStyle = `rgba(156,217,249,${p.active})`;
        ctx.stroke();
      });
    };

    // Mover os pontos de forma animada
    const shiftPoint = (p: Point) => {
      setTimeout(() => {
        p.x = p.originX - 50 + Math.random() * 100;
        p.y = p.originY - 50 + Math.random() * 100;
        shiftPoint(p);
      }, 1000 + Math.random() * 1000);
    };

    // Eventos
    const mouseMove = (e: MouseEvent) => {
      target.x = e.pageX;
      target.y = e.pageY;
    };

    const scrollCheck = () => {
      if (document.body.scrollTop > height) animateHeader = false;
      else animateHeader = true;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      largeHeader.style.height = height + "px";
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("scroll", scrollCheck);
    window.addEventListener("resize", resize);

    // Inicializa e anima
    initHeader();
    points.forEach(p => shiftPoint(p));
    animate();

    // Limpeza dos listeners ao desmontar o componente
    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("scroll", scrollCheck);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      id="large-header"
      ref={headerRef}
      style={{
        position: "fixed",
        top: "64px",
        left: 0,
        width: "100%",
        background: `url(${image}) no-repeat center center`,
        backgroundSize: "cover",
        zIndex: -1,
      }}
    >
      <canvas id="demo-canvas" ref={canvasRef}></canvas>
      {/* Se quiser manter o título ou outro conteúdo, pode incluir aqui */}
      {/* <h1 className="main-title">Connect <span className="thin">Three</span></h1> */}
    </div>
  );
};

export default AnimatedBackground;
