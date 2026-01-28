import { useTheme } from '../context/ThemeContext.jsx';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span className="theme-toggle__icon">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    );
};

export default ThemeToggle;
