import React from 'react';

export interface PomodoroIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const PomodoroIcon: React.FC<PomodoroIconProps> = ({
  className = "h-4 w-4",
  size,
  strokeWidth = 2,
  ...props
}) => {
  return (
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
      className={className}
      {...props}
    >
      {/* Stem */}
      <path d="M12 5V2" />
      {/* Left Leaf */}
      <path d="M12 5C10 3.8 8.5 4 7.5 5.5" />
      {/* Right Leaf */}
      <path d="M12 5C14 3.8 15.5 4 16.5 5.5" />
      {/* Tomato Body */}
      <path d="M12 5C7.2 5 3.5 8.8 3.5 13.5C3.5 18 7.2 21.5 12 21.5C16.8 21.5 20.5 18 20.5 13.5C20.5 8.8 16.8 5 12 5Z" />
      {/* Timer Clock Dial inside Tomato */}
      <path d="M12 9.5V13.5L14.5 15" />
    </svg>
  );
};

export default PomodoroIcon;
