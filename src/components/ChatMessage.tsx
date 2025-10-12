import { motion } from "framer-motion";
import { fadeVariants, scaleTap } from "@/lib/motion";

export default function ChatMessage({
  role,
  content,
  createdAt,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <motion.div
      variants={fadeVariants(0)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <motion.div
        variants={scaleTap}
        initial="initial"
        whileHover="hover"
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
          isUser
            ? "bg-primary text-primaryFg"
            : "bg-white/70 text-gray-900 dark:bg-white/10 dark:text-gray-100"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {createdAt && (
          <div
            className={`mt-1 text-[10px] ${
              isUser ? "text-white/80" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {new Date(createdAt).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
