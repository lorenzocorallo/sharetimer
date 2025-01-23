// DurationInput.tsx
import { useState, useRef, ChangeEvent } from "react";

interface DurationInputProps {
  onDurationChange: (seconds: number) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  onDurationChange,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDisplayInput = (): string => {
    const h = digits.slice(0, 2).join("") || "00";
    const m = digits.slice(2, 4).join("") || "00";
    const s = digits.slice(4, 6).join("") || "00";
    return `${h.length == 1 ? "0" : ""}${h}:${m.length == 1 ? "0" : ""}${m}:${s.length == 1 ? "0" : ""}${s}`;
  };

  const formatDisplay = (): string => {
    let str = "";
    const h = digits.slice(0, 2).join("");
    if (h) str += h + ":";
    const m = digits.slice(2, 4).join("");
    if (m) str += m + ":";
    const s = digits.slice(4, 6).join("") || "0";
    if (s) str += s;
    //return `${h}:${m}:${s}`;

    return str;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "").slice(0, 6);
    const newDigits = [...Array(6).fill("")];

    // Fill from right to left
    for (let i = 0; i < input.length; i++) {
      newDigits[6 - input.length + i] = input[i];
    }

    setDigits(newDigits);
  };

  const handleInputBlur = () => {
    const hours = parseInt(digits.slice(0, 2).join("") || "0");
    const minutes = parseInt(digits.slice(2, 4).join("") || "0");
    const seconds = parseInt(digits.slice(4, 6).join("") || "0");

    onDurationChange((hours * 3600 + minutes * 60 + seconds) * 1000);
  };

  const addTime = (secondsToAdd: number) => {
    // Convert current digits to total seconds
    const hours = parseInt(digits.slice(0, 2).join("") || "0");
    const minutes = parseInt(digits.slice(2, 4).join("") || "0");
    const seconds = parseInt(digits.slice(4, 6).join("") || "0");

    let totalSeconds = hours * 3600 + minutes * 60 + seconds + secondsToAdd;

    // Ensure totalSeconds is non-negative
    totalSeconds = Math.max(0, totalSeconds);

    // Convert total seconds back to hours, minutes, and seconds
    const newHours = Math.floor(totalSeconds / 3600);
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSeconds = totalSeconds % 60;

    // Update digits array
    const newDigits = [
      ...newHours.toString().padStart(2, "0"),
      ...newMinutes.toString().padStart(2, "0"),
      ...newSeconds.toString().padStart(2, "0"),
    ];

    setDigits(newDigits);

    // Notify parent of the updated duration
    onDurationChange(totalSeconds * 1000);
  };

  return (
    <div className="relative w-[280px] font-roboto pt-[72px]">
      {/* Hidden input that handles all the logic */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={digits.join("")}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="absolute inset-0 w-full h-[72px]  opacity-0 cursor-text peer"
        aria-label="Duration input"
      />

      {/* Background placeholder/display */}
      <div className="absolute inset-0 flex h-[72px] z-10 items-center justify-center text-[54px] leading-none tracking-wide text-blue-400 pointer-events-none font-normal peer-focus:hidden">
        {formatDisplay()}
      </div>
      <div className="absolute inset-0 items-center h-[72px] z-10  justify-center text-[54px] leading-none tracking-wide text-gray-400 pointer-events-none font-normal peer-focus:flex hidden">
        {formatDisplayInput()}
      </div>

      {/* Clickable overlay to focus the input */}
      <div
        className="absolute inset-0 cursor-pointer h-[72px] bg-slate-800 rounded-xl overflow-hidden  peer-focus:cursor-text px-2 peer-focus:pointer-events-none peer-focus:border border-blue-500"
        onClick={() => inputRef.current?.focus()}
      />
      <div className="flex pt-3 justify-between items-center gap-3">
        <button onClick={() => addTime(30 * 60)} className="py-1 flex-1 rounded-xl bg-slate-800">+30:00</button>
        <button onClick={() => addTime(5 * 60)} className="py-1 flex-1 rounded-xl bg-slate-800">+5:00</button>
        <button onClick={() => addTime(30)} className="py-1 flex-1 rounded-xl bg-slate-800">+0:30</button>
      </div>
    </div>
  );
};
