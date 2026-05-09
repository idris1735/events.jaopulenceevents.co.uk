"use client";

import { useEffect, useState } from "react";
import { isPlaceholderEventDate } from "@/lib/utils";

interface CountdownProps {
  target: string; // ISO date string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calc(target: string): TimeLeft {
  if (isPlaceholderEventDate(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
    expired: false
  };
}

export function Countdown({ target }: CountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => calc(target));

  useEffect(() => {
    const id = setInterval(() => setTime(calc(target)), 1_000);
    return () => clearInterval(id);
  }, [target]);

  if (time.expired) return null;

  const units = [
    { value: time.days,    label: "days" },
    { value: time.hours,   label: "hrs"  },
    { value: time.minutes, label: "min"  },
    { value: time.seconds, label: "sec"  },
  ];

  return (
    <div className="countdown">
      {units.map(({ value, label }, i) => (
        <div key={label} style={{ display: "contents" }}>
          {i > 0 && <span className="countdown__sep">:</span>}
          <div className="countdown__unit">
            <span className="countdown__value">{String(value).padStart(2, "0")}</span>
            <span className="countdown__label">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
