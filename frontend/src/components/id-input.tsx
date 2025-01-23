import React, {
  useState,
  useRef,
  MouseEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";

interface Props {
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export const IdInput: React.FC<Props> = ({
  onChange,
  disabled = false,
  className = "",
}) => {
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const firstEmptyIndex = values.findIndex((value) => {
    return value === "";
  });

  function handleChange(newValues: string[]) {
    setValues(newValues);
    const joined = newValues.join("");
    onChange?.(joined.length === 6 ? joined : null);
  }

  const focusNext = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < 6) {
      const input = inputRefs.current[nextIndex];
      input?.focus();
    }
  };

  const focusPrevious = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
    // focus the first empty input or the last if all are filled
    e.preventDefault();
    if (firstEmptyIndex === -1) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  };

  const handleInputChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value.toUpperCase();
    if (value.length <= 1 && /^[A-Z]$/.test(value)) {
      // Allow input at the first empty position or before
      if (firstEmptyIndex === -1 || index <= firstEmptyIndex) {
        const newValues = [...values];
        newValues[index] = value;
        handleChange(newValues);
        if (index === 5) {
          event.target.blur();
        } else {
          focusNext(index);
        }
      }
    }
  };

  const handleInputKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (values[index] === "") {
        const newValues = [...values];
        focusPrevious(index);
        if (index > 0) {
          newValues[index - 1] = "";
          handleChange(newValues);
        }
      } else {
        const newValues = [...values];
        newValues[index] = "";
        handleChange(newValues);
      }
    }
  };


  const handleInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text").toUpperCase();
    const letters = pastedText.match(/[A-Z]/g) || [];
    const newValues = [...values];

    for (let i = 0; i < Math.min(letters.length, 6); i++) {
      newValues[i] = letters[i];
    }

    handleChange(newValues);
    setValues(newValues);
    onChange?.(newValues.join(""));

    const firstEmptyIndex = newValues.findIndex((value) => value === "");
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div
      className={`flex gap-2 items-center justify-center ${className}`}
      role="group"
      aria-label="Six letter input"
    >
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          value={value}
          onChange={(e) => handleInputChange(index, e)}
          onKeyDown={(e) => handleInputKeyDown(index, e)}
          onMouseDown={handleInputClick}
          onPaste={handleInputPaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-xl font-bold border-b border-slate-800 rounded-lg focus:rounded-b-none transition-all duration-300 focus:border-blue-500 outline-none uppercase bg-slate-800 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          aria-label={`Letter ${index + 1}`}
        />
      ))}
    </div>
  );
};
