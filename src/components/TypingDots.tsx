import { motion } from "framer-motion";

export default function TypingDots() {
  const dot = {
    initial: { y: 0, opacity: 0.5 },
    animate: {
      y: -3,
      opacity: 1,
      transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" as const },
    },
  };

  return (
    <div className="flex items-center gap-1 pl-1 pt-1">
      <span className="text-xs text-gray-500">Assistant is typing</span>
      <div className="ml-2 flex gap-1">
        <motion.span className="h-2 w-2 rounded-full bg-gray-400" variants={dot} initial="initial" animate="animate" />
        <motion.span
          className="h-2 w-2 rounded-full bg-gray-400"
          variants={dot}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-gray-400"
          variants={dot}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        />
      </div>
    </div>
  );
}
