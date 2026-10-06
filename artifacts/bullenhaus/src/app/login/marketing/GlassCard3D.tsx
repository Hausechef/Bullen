import React, { useRef } from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode };

/**
 * Стеклянная 3D-карточка страницы /login: 20% светлая заливка, blur,
 * мягкий наклон за курсором (perspective + rotateX/Y) и блик,
 * следующий за указателем. Стили — .card-glass3d в index.css.
 */
export const GlassCard3D: React.FC<Props> = ({ children, className = '', ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--tilt-x', `${((0.5 - py) * 7).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${((px - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty('--light-x', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--light-y', `${(py * 100).toFixed(1)}%`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className={`card-glass3d ${className}`} {...rest}>
      {children}
    </div>
  );
};
