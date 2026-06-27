'use client';

import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glowColor?: string;
}

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  glowColor,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02, y: -4, transition: { duration: 0.2 } } : undefined}
      className={`rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm transition-shadow ${glowColor ? `hover:shadow-[0_0_30px_${glowColor}20]` : 'hover:shadow-md'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStatCard({
  icon,
  label,
  value,
  sublabel,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  delay?: number;
}) {
  return (
    <AnimatedCard delay={delay} glowColor={color}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.2, type: 'spring' }}
            className="mt-1 text-3xl font-bold truncate"
            style={{ color }}
          >
            {value}
          </motion.p>
          {sublabel && <p className="mt-0.5 text-xs font-medium text-gray-400">{sublabel}</p>}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.1, type: 'spring' }}
          className="rounded-xl p-3 shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </motion.div>
      </div>
    </AnimatedCard>
  );
}
