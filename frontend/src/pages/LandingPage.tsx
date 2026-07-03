import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedShaderHero from "@/components/ui/animated-shader-hero";
import { Activity, BrainCircuit, BellRing } from "lucide-react";

const features = [
  { icon: Activity, label: "PSI + KS-Test drift detection" },
  { icon: BrainCircuit, label: "SHAP explainability" },
  { icon: BellRing, label: "Severity-graded alerts" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0b0b] font-sans tracking-tight text-white">
      <AnimatedShaderHero
        headline={{
          line1: "ML Health",
          line2: "Monitor",
        }}
        subtitle="Detect data drift. Maintain model health. Real-time observability for production machine learning systems."
        buttons={{
          primary: {
            text: "Enter Monitoring Console",
            onClick: () => navigate("/dashboard"),
          },
        }}
      >
        {/* Background typography */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 0.1, y: 20 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="flex w-full translate-y-20 items-center justify-center py-20"
        >
          <h1 className="text-[15vw] font-black uppercase leading-none tracking-[-0.05em] text-white md:text-[25vw]">
            MONITOR
          </h1>
        </motion.div>
      </AnimatedShaderHero>

      {/* Feature strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="pointer-events-none absolute bottom-8 left-0 z-10 flex w-full items-center justify-center px-6"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          {features.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-md"
            >
              <Icon className="h-3.5 w-3.5 text-white/50" />
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
