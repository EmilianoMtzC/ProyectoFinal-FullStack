import { useId } from "react";

function Input({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error = "",
    className = ""
}) {
    const inputId = useId();
    return (
        <div className={`input-field ${className}`}>
            {label ? (
                <label className="input-label" htmlFor={inputId}>
                    {label}
                </label>
            ) : null}
            <input
                id={inputId}
                className="input-control"
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
            />
            {error ? (
                <div className="input-error" id={`${inputId}-error`}>
                    {error}
                </div>
            ) : null}
        </div>
    );
}

export default Input;
