import { motion } from "framer-motion";

const SustainabilitySection = () => {
  return (
    <section className="pt-4 md:pt-6 pb-10 md:pb-14">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="border-[3px] border-border rounded-3xl px-8 py-10 md:px-14 md:py-12 max-w-3xl mx-auto text-center"
        >
          <h2 className="font-script text-3xl md:text-4xl text-foreground mb-4 flex items-center justify-center gap-3">
            <span className="text-primary text-2xl md:text-3xl select-none">❧</span>
            Thoughtful Baking
            <span className="text-primary text-2xl md:text-3xl select-none" style={{ display: "inline-block", transform: "scaleX(-1)" }}>❧</span>
          </h2>
          <p className="font-body text-sm md:text-base text-foreground/70 leading-relaxed">
            We believe in sustainability — all our bakes are made to order, helping us minimize
            waste and ensure freshness in every bite. It allows us to be thoughtful in what we
            create, keeping our process intentional and responsible.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SustainabilitySection;
