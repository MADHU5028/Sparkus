import './Card.css';

const Card = ({ children, className = '', hover = false, ...props }) => {
    return (
        <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Card;
