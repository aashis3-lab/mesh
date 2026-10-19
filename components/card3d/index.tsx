"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the scene loads client-side after the page paints.
export const Card3D = dynamic(() => import("./Card3D"), { ssr: false });
