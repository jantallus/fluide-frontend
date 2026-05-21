'use client';
import { useState } from 'react';

export default function ScrollToBookingButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => document.getElementById('etape-2')?.scrollIntoView({ behavior: 'smooth' })}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        backgroundColor: hovered ? '#312783' : '#E6007E',
        color: 'white',
        fontWeight: 700,
        fontSize: '18px',
        lineHeight: '24px',
        padding: '12px 17px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'background-color 0.3s ease',
      }}
    >
      Réserver votre vol
    </button>
  );
}
