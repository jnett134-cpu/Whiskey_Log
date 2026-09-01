"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function SortMenu({ options, active, activeLabel }) {
  const ref = useRef(null);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };

    function onPointerDown(e) {
      if (ref.current?.open && !ref.current.contains(e.target)) close();
    }
    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="sort-menu">
      <summary>Sort: {activeLabel}</summary>
      <div className="sort-menu-list">
        {options.map(({ key, label, href }) => (
          <Link
            key={key}
            href={href}
            aria-current={key === active ? "true" : undefined}
            onClick={() => {
              if (ref.current) ref.current.open = false;
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}
