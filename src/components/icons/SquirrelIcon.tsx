import type { SVGProps } from "react";

interface Props extends Omit<SVGProps<SVGSVGElement>, "size"> {
  size?: number;
  strokeWidth?: number;
}

/** Simple flat squirrel icon, stroke-based to match lucide style. */
const SquirrelIcon = ({ size = 22, strokeWidth = 1.8, ...props }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Bushy tail curling up behind the body */}
    <path d="M17 19c3 0 5-2 5-5 0-4-3-7-7-7-1 0-2 .2-3 .6" />
    {/* Body */}
    <path d="M6 20c0-4 2-7 6-7 2 0 3 .8 3 2.5S13.5 18 12 18H8" />
    {/* Head */}
    <circle cx="8.5" cy="9.5" r="3.2" />
    {/* Ears */}
    <path d="M6.4 7.2c-.4-.8-.2-1.7.4-2.1.6-.4 1.5-.1 1.9.7" />
    <path d="M10.6 7.2c.4-.8.2-1.7-.4-2.1-.6-.4-1.5-.1-1.9.7" />
    {/* Eye */}
    <circle cx="9.4" cy="9.2" r=".6" fill="currentColor" stroke="none" />
    {/* Acorn / paws hint */}
    <path d="M8 20h-2" />
  </svg>
);

export default SquirrelIcon;
