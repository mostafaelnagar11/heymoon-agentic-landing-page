/* "HeyMoon" plus a ".AI" span. Text only: callers wrap it in their own plain <a> (rule 2.4.11). */
const SIZE = { sm: "text-[15px]", md: "text-[17px]", lg: "text-[19px]" } as const;
const TONE = {
  night: { base: "text-white", ai: "text-brand-300" },   // ".AI" #A78BFA
  paper: { base: "text-ink", ai: "text-brand-700" },     // ".AI" #4D2FB0
} as const;

export function Wordmark({ size = "md", tone = "night", className = "" }: {
  size?: keyof typeof SIZE; tone?: keyof typeof TONE; className?: string;
}) {
  const t = TONE[tone];
  return (
    <span dir="ltr" className={`select-none whitespace-nowrap font-semibold tracking-[-0.03em] transition-colors duration-[250ms] ${SIZE[size]} ${t.base} ${className}`}>
      HeyMoon<span className={`transition-colors duration-[250ms] ${t.ai}`}>.AI</span>
    </span>
  );
}
