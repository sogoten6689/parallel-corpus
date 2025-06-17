'use client';

import React from 'react';

type Badge =
  | {
      label: string;
      color: string;
      bg: string;
    }
  | React.ReactNode;

interface BreadcrumbHeaderProps {
  title: string;
  breadcrumbs?: string[];
  badges?: Badge[];
  onBack?: () => void;
}

const HeaderFull: React.FC<BreadcrumbHeaderProps> = ({
  title,
  breadcrumbs = [],
  badges = [],
}) => {
  return (
    <div className="flex flex-col px-6 py-4 border bg-white">
    </div>
  );
};

export default HeaderFull;
