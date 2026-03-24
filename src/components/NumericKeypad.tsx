import React from 'react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

export default function NumericKeypad({ onKeyPress, onConfirm, onClear }: NumericKeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="grid grid-cols-3 gap-4">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          className="bg-slate-800 text-white text-2xl font-bold p-6 rounded-2xl hover:bg-slate-700 transition"
        >
          {key}
        </button>
      ))}
      <button onClick={onClear} className="bg-red-500 text-white text-xl font-bold p-6 rounded-2xl hover:bg-red-600 transition">Clear</button>
      <button onClick={onConfirm} className="bg-green-500 text-white text-xl font-bold p-6 rounded-2xl hover:bg-green-600 transition col-span-2">Confirm</button>
    </div>
  );
}
