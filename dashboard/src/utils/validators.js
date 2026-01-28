// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password (min 6 characters)
export const isValidPassword = (password) => {
    return password && password.length >= 6;
};

// Validate required field
export const isRequired = (value) => {
    return value && value.trim().length > 0;
};

// Validate number range
export const isInRange = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};

// Validate session code format
export const isValidSessionCode = (code) => {
    const codeRegex = /^SPARK-[A-Z0-9]{6}$/;
    return codeRegex.test(code);
};
