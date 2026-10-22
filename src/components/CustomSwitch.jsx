import React from "react";
import { useTranslation } from "react-i18next";

export default function CustomSwitch({
  value,
  onChange,
  options,
  ariaLabel,
}) {
  const { t } = useTranslation();
  return (
    <div
      className="cipher-segmented-control"
      role="group"
      aria-label={ariaLabel || t("uiCommon.chartDisplayMode")}
    >
      {options.map((option, index) => (
        <button
          className="cipher-segmented-option"
          type="button"
          key={option}
          aria-pressed={value === index}
          onClick={() => onChange(index)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
