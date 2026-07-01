import Icon from './Icon';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    icon: iconName, 
    iconPosition = 'left', 
    className = '', 
    disabled = false,
    onClick,
    type = 'button'
}) => {
    const variants = {
        primary: 'bg-primary text-on-primary shadow-md shadow-primary/20',
        secondary: 'bg-secondary-container text-on-secondary-container',
        outline: 'border border-outline-variant text-on-surface hover:bg-surface-container-high',
        ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        error: 'bg-error text-on-error',
        container: 'bg-primary-container text-on-primary-container' // for the soft accent style
    };

    // Use customized paddings from design ref
    // px-lg = 24px (on each side), py-3 = 12px
    // We'll use standard tailwind classes that map to these.
    // px-6 = 24px, py-3 = 12px

    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed gap-2';
    
    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = size === 'sm' ? 'px-4 py-2 text-sm' : size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        >
            {iconName && iconPosition === 'left' && <Icon name={iconName} size={20} />}
            {children}
            {iconName && iconPosition === 'right' && <Icon name={iconName} size={20} />}
        </button>
    );
};

export default Button;
