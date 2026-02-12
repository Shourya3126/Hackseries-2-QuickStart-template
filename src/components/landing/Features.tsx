import { motion } from "framer-motion";
import { QrCode, Vote, Bot, Award } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Secure Attendance",
    description:
      "QR + Selfie + Liveness detection for tamper-proof attendance logged on-chain.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Vote,
    title: "Anonymous Voting",
    description:
      "Zero-knowledge proofs ensure ballot secrecy while maintaining verifiable election results.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Bot,
    title: "AI Complaints",
    description:
      "Submit anonymized complaints analyzed by AI, with immutable resolution tracking.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Award,
    title: "Verifiable Certificates",
    description:
      "Issue tamper-proof digital certificates with QR verification on the Algorand blockchain.",
    gradient: "from-primary to-accent",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="section-heading mb-4">
            Built for <span className="gradient-text">Trust</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Every feature designed to eliminate fraud, increase transparency, and
            empower campus communities.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={cardVariants}>
              <div className="glass-card-hover group p-8">
                <div
                  className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-3`}
                >
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
