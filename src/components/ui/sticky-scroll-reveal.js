"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const StickyScroll = ({ content, contentClassName }) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    // uncomment line 22 and comment line 23 if you DONT want the overflow container and want to have it change on the entire page scroll
    // target: ref
    container: ref,
    offset: ["start start", "end end"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  const backgroundColors = [
    "#040816", // slate-900
  ];
  // const linearGradients = [
  //   "linear-gradient(to bottom right, #06b6d4, #10b981)", // cyan-500 to emerald-500
  //   "linear-gradient(to bottom right, #ec4899, #6366f1)", // pink-500 to indigo-500
  //   "linear-gradient(to bottom right, #f97316, #eab308)", // orange-500 to yellow-500
  // ];

  // useEffect(() => {
  //   setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
  // }, [activeCard]);

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[0],
      }}
      className="relative flex h-[37rem] justify-center space-x-10 overflow-y-auto rounded-md p-10"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE 10+
      }}
      ref={ref}
    >
      <div className="div relative flex items-start px-4">
        <div className="max-w-md">
          {content.map((item, index) => (
            <div key={item.title + index} className="">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="mt-40 text-3xl font-bold text-slate-100"
                dangerouslySetInnerHTML={{ __html: item.title }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="mt-10 text-lg text-slate-300 my-20"
              >
                {item.description
                  .replace(/\|\|/g, "\n\n")
                  .replace(/\|/g, "\n")
                  .split("\n")
                  .map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
              </motion.p>
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div
        style={{ background: backgroundColors[0] }}
        className={cn(
          "sticky top-10 hidden overflow-hidden rounded-md bg-white lg:block ",
          contentClassName
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};
