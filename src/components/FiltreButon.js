import React, { useState } from 'react';

function FiltreButon({ label, aktif, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
        fontSize: '12px', fontWeight: '500',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
        backgroundColor: aktif ? '#4f46e5' : hovered ? '#3f3f4c' : '#303038',
        border: aktif ? '1px solid #4f46e5' : hovered ? '1px solid #52525f' : '1px solid #40404a',
        color: aktif ? '#fff' : hovered ? '#e5e7eb' : '#b4b4bd',
      }}
    >{label}</button>
  );
}

export default FiltreButon;
