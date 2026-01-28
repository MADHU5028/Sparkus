import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    ...props
}) => {
    const className = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''}`;

    return (
        <button
            type={type}
            className={className}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className="spinner"></span> : children}
        </button>
    );
};

export default Button;
