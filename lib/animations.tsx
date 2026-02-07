import { useEffect, useRef, useState } from "react";

export const useScrollFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  return {
    ref,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  };
};

export const FadeInSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, style } = useScrollFadeIn();
  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
};
