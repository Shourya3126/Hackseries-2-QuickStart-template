import ParticleField from "@/components/3d/ParticleField";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import Footer from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="relative min-h-screen">
      <ParticleField />
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Footer />
    </div>
  );
}
